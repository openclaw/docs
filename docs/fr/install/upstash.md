---
read_when:
    - Déployer OpenClaw sur Upstash Box
    - Vous voulez un environnement Linux géré pour OpenClaw avec un accès au tableau de bord via tunnel SSH
summary: Héberger OpenClaw sur Upstash Box avec maintien de connexion et accès par tunnel SSH
title: Boîte Upstash
x-i18n:
    generated_at: "2026-06-27T17:40:37Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 06d2eb41e1beb0ab3145baa861e0bee7e3efef20324dc4e0e82ba08910937d20
    source_path: install/upstash.md
    workflow: 16
---

Exécutez un Gateway OpenClaw persistant sur Upstash Box, un environnement Linux managé
avec prise en charge du cycle de vie avec maintien actif.

Utilisez un tunnel SSH pour accéder au tableau de bord. N’exposez pas directement
le port du Gateway à l’internet public.

## Prérequis

- Compte Upstash
- Upstash Box avec maintien actif
- Client SSH sur votre machine locale

## Créer une Box

Créez une Box avec maintien actif dans la console Upstash. Notez l’ID de la Box, par exemple
`right-flamingo-14486`, ainsi que votre clé API Box.

Upstash maintient son guide OpenClaw Box actuel à l’adresse
[Configuration d’OpenClaw](https://upstash.com/docs/box/guides/openclaw-setup).

## Se connecter avec un tunnel SSH

Redirigez le port du tableau de bord OpenClaw vers votre machine locale. Utilisez votre clé API Box
comme mot de passe SSH lorsque vous y êtes invité :

```bash
ssh -o ServerAliveInterval=15 -o ServerAliveCountMax=3 -L 18789:127.0.0.1:18789 <box-id>@us-east-1.box.upstash.com
```

Les options de maintien de connexion réduisent les interruptions du tunnel inactif pendant la configuration initiale.

## Installer OpenClaw

Dans la Box :

```bash
sudo npm install -g openclaw
```

## Exécuter la configuration initiale

```bash
openclaw onboard --install-daemon
```

Suivez les invites. Copiez l’URL et le jeton du tableau de bord lorsque la configuration initiale se termine.

## Démarrer le Gateway

Configurez le Gateway pour le réseau de la Box et démarrez-le en arrière-plan :

```bash
openclaw config set gateway.bind lan
nohup openclaw gateway > gateway.log 2>&1 &
```

Avec le tunnel SSH actif, ouvrez l’URL du tableau de bord localement :

```text
http://127.0.0.1:18789/#token=<your-token>
```

## Redémarrage automatique

Définissez cette commande comme script d’initialisation de la Box afin que le Gateway redémarre lorsque la Box
démarre :

```bash
nohup openclaw gateway > gateway.log 2>&1 &
```

## Dépannage

Si SSH se fige pendant la configuration initiale, reconnectez-vous avec une configuration SSH propre et
des options de maintien de connexion :

```bash
ssh -F /dev/null -o ControlMaster=no -o ServerAliveInterval=15 -o ServerAliveCountMax=3 -L 18789:127.0.0.1:18789 <box-id>@us-east-1.box.upstash.com
```

Cela contourne les paramètres locaux obsolètes de `~/.ssh/config` et maintient le tunnel actif
pendant les périodes d’inactivité du réseau.

## Connexe

- [Accès à distance](/fr/gateway/remote)
- [Sécurité du Gateway](/fr/gateway/security)
- [Mettre à jour OpenClaw](/fr/install/updating)
