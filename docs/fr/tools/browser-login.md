---
read_when:
    - Vous devez vous connecter à des sites pour l’automatisation du navigateur
    - Vous souhaitez publier des mises à jour sur X/Twitter
summary: Connexions manuelles pour l’automatisation du navigateur et la publication sur X/Twitter
title: Connexion via le navigateur
x-i18n:
    generated_at: "2026-07-12T03:08:03Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: bccd363cf7c9611f4687d50a92f7fb3e2fd1c1d67bb27a80c892f7ac58ae1f8f
    source_path: tools/browser-login.md
    workflow: 16
---

## Connexion manuelle (recommandée)

Lorsqu’un site nécessite une connexion, connectez-vous manuellement dans le profil `openclaw` du navigateur de l’hôte. Ne communiquez pas vos identifiants au modèle : les connexions automatisées déclenchent souvent les mécanismes de défense contre les robots et peuvent verrouiller le compte.

Utilisez le navigateur de l’hôte (connexion manuelle) à la fois pour consulter du contenu (recherches/fils de discussion) et publier sur X/Twitter ainsi que sur d’autres sites sensibles aux robots. Les sessions de navigateur en bac à sable sont plus susceptibles de déclencher la détection des robots.

Retour à la documentation principale du navigateur : [Navigateur](/fr/tools/browser).

## Quel profil Chrome est utilisé ?

OpenClaw contrôle un profil Chrome dédié nommé `openclaw` (interface teintée d’orange), distinct de votre profil de navigation quotidien.

Pour les appels de l’outil de navigation de l’agent :

- Choix par défaut : l’agent utilise son navigateur `openclaw` isolé.
- Utilisez `profile="user"` uniquement lorsque les sessions déjà connectées sont nécessaires et que vous êtes devant l’ordinateur pour cliquer ou approuver toute demande de connexion.
- Si vous disposez de plusieurs profils dans le navigateur utilisateur, indiquez explicitement le profil au lieu de le deviner.

Deux méthodes permettent d’accéder au profil `openclaw` :

1. Demandez à l’agent d’ouvrir le navigateur, puis connectez-vous vous-même.
2. Ouvrez-le via la CLI :

```bash
openclaw browser start
openclaw browser open https://x.com
```

Pour un profil autre que celui par défaut, placez `--browser-profile <name>` avant la sous-commande (la valeur par défaut est `openclaw`) :

```bash
openclaw browser --browser-profile <name> open https://x.com
```

## Mise en bac à sable : autoriser l’accès au navigateur de l’hôte

Si l’agent est exécuté dans un bac à sable, ses appels à l’outil `browser` ciblent par défaut le navigateur du bac à sable, et non celui de l’hôte. Pour permettre à l’agent de cibler plutôt le navigateur de l’hôte :

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

Les appels via la CLI ciblent toujours le navigateur de l’hôte, jamais le bac à sable. Vous pouvez donc ouvrir vous-même le navigateur de l’hôte indépendamment de ce paramètre :

```bash
openclaw browser --browser-profile openclaw open https://x.com
```

Une fois `sandbox.browser.allowHostControl: true` défini, les appels de l’agent à l’outil `browser` peuvent également cibler l’hôte. Vous pouvez aussi désactiver la mise en bac à sable pour l’agent qui publie les mises à jour.

## Pages connexes

- [Navigateur](/fr/tools/browser)
- [Dépannage du navigateur sous Linux](/fr/tools/browser-linux-troubleshooting)
- [Dépannage du navigateur sous WSL2](/fr/tools/browser-wsl2-windows-remote-cdp-troubleshooting)
