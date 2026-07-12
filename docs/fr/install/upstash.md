---
read_when:
    - Déploiement d’OpenClaw sur Upstash Box
    - Vous souhaitez un environnement Linux géré pour OpenClaw avec un accès au tableau de bord via un tunnel SSH
summary: Hébergez OpenClaw sur Upstash Box avec maintien de l’activité et accès par tunnel SSH
title: Upstash Box
x-i18n:
    generated_at: "2026-07-12T15:27:53Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 29232c43e0e4940b7445ab8896c9ccd3e81d0fdbdd522d7f50cb8c8057ac18f0
    source_path: install/upstash.md
    workflow: 16
---

Exécutez un Gateway OpenClaw persistant sur Upstash Box, un environnement Linux géré
avec prise en charge d’un cycle de vie maintenant le service actif.

Utilisez un tunnel SSH pour accéder au tableau de bord. N’exposez pas directement
le port du Gateway à l’Internet public.

## Prérequis

- Compte Upstash
- Upstash Box avec maintien de l’activité
- Client SSH sur votre machine locale

## Créer une Box

Créez une Box avec maintien de l’activité dans l’Upstash Console. Notez l’ID de la Box (par exemple
`right-flamingo-14486`) et votre clé API de Box.

Upstash maintient à jour son guide de configuration d’une Box OpenClaw à la page
[Configuration d’OpenClaw](https://upstash.com/docs/box/guides/openclaw-setup).

## Se connecter avec un tunnel SSH

Redirigez le port du tableau de bord OpenClaw vers votre machine locale. Utilisez votre clé API de Box
comme mot de passe SSH lorsque vous y êtes invité :

```bash
ssh -o ServerAliveInterval=15 -o ServerAliveCountMax=3 -L 18789:127.0.0.1:18789 <box-id>@us-east-1.box.upstash.com
```

Les options de maintien de la connexion réduisent les interruptions du tunnel dues à l’inactivité pendant la configuration initiale.

## Installer OpenClaw

Dans la Box :

```bash
sudo npm install -g openclaw
```

## Exécuter la configuration initiale

```bash
openclaw onboard --install-daemon
```

Suivez les invites. Copiez l’URL et le jeton du tableau de bord lorsque la configuration initiale est terminée.

## Démarrer le Gateway

Configurez le Gateway pour le réseau de la Box et démarrez-le en arrière-plan :

```bash
openclaw config set gateway.bind lan
nohup openclaw gateway > gateway.log 2>&1 &
```

Lorsque le tunnel SSH est actif, ouvrez localement l’URL du tableau de bord :

```text
http://127.0.0.1:18789/#token=<your-token>
```

## Redémarrage automatique

Définissez cette commande comme script d’initialisation de la Box afin que le Gateway redémarre au démarrage de la Box :

```bash
nohup openclaw gateway > gateway.log 2>&1 &
```

## Résolution des problèmes

Si SSH se fige pendant la configuration initiale, reconnectez-vous avec une configuration SSH vierge et
des options de maintien de la connexion :

```bash
ssh -F /dev/null -o ControlMaster=no -o ServerAliveInterval=15 -o ServerAliveCountMax=3 -L 18789:127.0.0.1:18789 <box-id>@us-east-1.box.upstash.com
```

Cette commande contourne les paramètres locaux obsolètes de `~/.ssh/config` et maintient le tunnel actif
pendant les périodes d’inactivité du réseau.

## Voir aussi

- [Accès à distance](/fr/gateway/remote)
- [Sécurité du Gateway](/fr/gateway/security)
- [Mise à jour d’OpenClaw](/fr/install/updating)
