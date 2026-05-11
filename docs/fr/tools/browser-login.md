---
read_when:
    - Vous devez vous connecter aux sites pour l’automatisation du navigateur
    - Vous voulez publier des mises à jour sur X/Twitter
summary: Connexions manuelles pour l’automatisation de navigateur et la publication sur X/Twitter
title: Connexion via le navigateur
x-i18n:
    generated_at: "2026-05-11T20:56:59Z"
    model: gpt-5.5
    provider: openai
    source_hash: 89501b47611a39df5a658ed7e144b7c16a07188dfa52544b56cbfc6e296e2ecc
    source_path: tools/browser-login.md
    workflow: 16
---

## Connexion manuelle (recommandée)

Lorsqu’un site nécessite une connexion, **connectez-vous manuellement** dans le profil de navigateur de l’**hôte** (le navigateur openclaw).

Ne donnez **pas** vos identifiants au modèle. Les connexions automatisées déclenchent souvent des défenses anti-bots et peuvent verrouiller le compte.

Retour à la documentation principale du navigateur : [Navigateur](/fr/tools/browser).

## Quel profil Chrome est utilisé ?

OpenClaw contrôle un **profil Chrome dédié** (nommé `openclaw`, avec une interface teintée d’orange). Il est distinct de votre profil de navigateur quotidien.

Pour les appels d’outil de navigateur de l’agent :

- Choix par défaut : l’agent doit utiliser son navigateur `openclaw` isolé.
- Utilisez `profile="user"` uniquement lorsque des sessions connectées existantes sont nécessaires et que l’utilisateur est devant l’ordinateur pour cliquer/approuver toute invite d’attachement.
- Si vous avez plusieurs profils de navigateur utilisateur, indiquez explicitement le profil au lieu de deviner.

Deux moyens simples d’y accéder :

1. **Demandez à l’agent d’ouvrir le navigateur**, puis connectez-vous vous-même.
2. **Ouvrez-le via la CLI** :

```bash
openclaw browser start
openclaw browser open https://x.com
```

Si vous avez plusieurs profils, passez `--browser-profile <name>` (la valeur par défaut est `openclaw`).

## X/Twitter : flux recommandé

- **Lecture/recherche/fils :** utilisez le navigateur de l’**hôte** (connexion manuelle).
- **Publier des mises à jour :** utilisez le navigateur de l’**hôte** (connexion manuelle).

## Mise en bac à sable + accès au navigateur hôte

Les sessions de navigateur en bac à sable sont **plus susceptibles** de déclencher la détection des bots. Pour X/Twitter (et d’autres sites stricts), privilégiez le navigateur de l’**hôte**.

Si l’agent est en bac à sable, l’outil de navigateur utilise le bac à sable par défaut. Pour autoriser le contrôle de l’hôte :

```json5
{
  agents: {
    defaults: {
      sandbox: {
        mode: "non-main",
        browser: {
          allowHostControl: true,
        },
      },
    },
  },
}
```

Ouvrez ensuite vous-même le navigateur hôte (les invocations CLI s’exécutent toujours sur le navigateur hôte) :

```bash
openclaw browser open https://x.com --browser-profile openclaw
```

Les appels de l’outil `browser` de l’agent peuvent ensuite cibler l’hôte une fois que `sandbox.browser.allowHostControl: true` est défini. Vous pouvez également désactiver la mise en bac à sable pour l’agent qui publie les mises à jour.

## Connexe

- [Navigateur](/fr/tools/browser)
- [Dépannage du navigateur sous Linux](/fr/tools/browser-linux-troubleshooting)
- [Dépannage du navigateur WSL2](/fr/tools/browser-wsl2-windows-remote-cdp-troubleshooting)
