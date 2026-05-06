---
read_when:
    - Vous devez vous connecter à des sites pour l’automatisation du navigateur
    - Vous souhaitez publier des mises à jour sur X/Twitter
summary: Connexions manuelles pour l’automatisation de navigateur + publication sur X/Twitter
title: Connexion via le navigateur
x-i18n:
    generated_at: "2026-05-06T07:39:51Z"
    model: gpt-5.5
    provider: openai
    source_hash: 235194fd3a49724247f98e6d7c848c4cc3317f749ff4a8918c2172b73baf21e3
    source_path: tools/browser-login.md
    workflow: 16
---

## Connexion manuelle (recommandée)

Lorsqu’un site nécessite une connexion, **connectez-vous manuellement** dans le profil de navigateur **hôte** (le navigateur openclaw).

Ne donnez **pas** vos identifiants au modèle. Les connexions automatisées déclenchent souvent les protections anti-bot et peuvent verrouiller le compte.

Retour à la documentation principale du navigateur : [Navigateur](/fr/tools/browser).

## Quel profil Chrome est utilisé ?

OpenClaw contrôle un **profil Chrome dédié** (nommé `openclaw`, avec une interface teintée d’orange). Il est distinct de votre profil de navigateur quotidien.

Pour les appels d’outil de navigateur de l’agent :

- Choix par défaut : l’agent doit utiliser son navigateur `openclaw` isolé.
- Utilisez `profile="user"` uniquement lorsque des sessions déjà connectées sont nécessaires et que l’utilisateur est devant l’ordinateur pour cliquer/approuver toute invite d’attachement.
- Si vous avez plusieurs profils de navigateur utilisateur, indiquez explicitement le profil au lieu de deviner.

Deux façons simples d’y accéder :

1. **Demandez à l’agent d’ouvrir le navigateur**, puis connectez-vous vous-même.
2. **Ouvrez-le via la CLI** :

```bash
openclaw browser start
openclaw browser open https://x.com
```

Si vous avez plusieurs profils, passez `--browser-profile <name>` (la valeur par défaut est `openclaw`).

## X/Twitter : flux recommandé

- **Lecture/recherche/fils :** utilisez le navigateur **hôte** (connexion manuelle).
- **Publier des mises à jour :** utilisez le navigateur **hôte** (connexion manuelle).

## Sandboxing + accès au navigateur hôte

Les sessions de navigateur sandboxées sont **plus susceptibles** de déclencher la détection de bots. Pour X/Twitter (et d’autres sites stricts), préférez le navigateur **hôte**.

Si l’agent est sandboxé, l’outil de navigateur utilise le sandbox par défaut. Pour autoriser le contrôle de l’hôte :

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

Ciblez ensuite le navigateur hôte :

```bash
openclaw browser open https://x.com --browser-profile openclaw --target host
```

Ou désactivez le sandboxing pour l’agent qui publie les mises à jour.

## Articles connexes

- [Navigateur](/fr/tools/browser)
- [Dépannage du navigateur Linux](/fr/tools/browser-linux-troubleshooting)
- [Dépannage du navigateur WSL2](/fr/tools/browser-wsl2-windows-remote-cdp-troubleshooting)
