---
read_when:
    - Vous souhaitez connecter OpenClaw à WeChat ou Weixin
    - Vous installez ou dépannez le plugin de canal openclaw-weixin
    - Vous devez comprendre comment les plugins de canaux externes s’exécutent aux côtés du Gateway
summary: Configuration du canal WeChat via le Plugin externe openclaw-weixin
title: WeChat
x-i18n:
    generated_at: "2026-05-06T07:16:07Z"
    model: gpt-5.5
    provider: openai
    source_hash: 803557a4fc92056c63053a3388100a451b2d85d4e892877707b3c2e3a677c0b0
    source_path: channels/wechat.md
    workflow: 16
---

OpenClaw se connecte à WeChat via le plugin de canal externe
`@tencent-weixin/openclaw-weixin` de Tencent.

Statut : plugin externe. Les discussions directes et les médias sont pris en charge. Les discussions de groupe ne sont pas
annoncées par les métadonnées de capacités du plugin actuel.

## Nommage

- **WeChat** est le nom présenté aux utilisateurs dans cette documentation.
- **Weixin** est le nom utilisé par le package de Tencent et par l’id du plugin.
- `openclaw-weixin` est l’id du canal OpenClaw.
- `@tencent-weixin/openclaw-weixin` est le package npm.

Utilisez `openclaw-weixin` dans les commandes CLI et les chemins de configuration.

## Fonctionnement

Le code WeChat ne se trouve pas dans le dépôt principal d’OpenClaw. OpenClaw fournit le
contrat générique de plugin de canal, et le plugin externe fournit l’environnement d’exécution
spécifique à WeChat :

1. `openclaw plugins install` installe `@tencent-weixin/openclaw-weixin`.
2. Le Gateway découvre le manifeste du plugin et charge le point d’entrée du plugin.
3. Le plugin enregistre l’id de canal `openclaw-weixin`.
4. `openclaw channels login --channel openclaw-weixin` démarre la connexion par QR code.
5. Le plugin stocke les identifiants du compte dans le répertoire d’état d’OpenClaw.
6. Lorsque le Gateway démarre, le plugin lance son moniteur Weixin pour chaque
   compte configuré.
7. Les messages WeChat entrants sont normalisés via le contrat de canal, acheminés vers
   l’agent OpenClaw sélectionné, puis renvoyés par le chemin sortant du plugin.

Cette séparation est importante : le cœur d’OpenClaw doit rester indépendant des canaux. La connexion WeChat,
les appels à l’API Tencent iLink, l’envoi et le téléchargement de médias, les jetons de contexte et la
surveillance des comptes relèvent du plugin externe.

## Installation

Installation rapide :

```bash
npx -y @tencent-weixin/openclaw-weixin-cli install
```

Installation manuelle :

```bash
openclaw plugins install "@tencent-weixin/openclaw-weixin"
openclaw config set plugins.entries.openclaw-weixin.enabled true
```

Redémarrez le Gateway après l’installation :

```bash
openclaw gateway restart
```

## Connexion

Exécutez la connexion par QR code sur la même machine que celle qui exécute le Gateway :

```bash
openclaw channels login --channel openclaw-weixin
```

Scannez le QR code avec WeChat sur votre téléphone et confirmez la connexion. Le plugin enregistre
localement le jeton du compte après un scan réussi.

Pour ajouter un autre compte WeChat, exécutez à nouveau la même commande de connexion. Pour plusieurs
comptes, isolez les sessions de message direct par compte, canal et expéditeur :

```bash
openclaw config set session.dmScope per-account-channel-peer
```

## Contrôle d’accès

Les messages directs utilisent le modèle normal d’appairage et de liste d’autorisation d’OpenClaw pour les plugins
de canal.

Approuvez les nouveaux expéditeurs :

```bash
openclaw pairing list openclaw-weixin
openclaw pairing approve openclaw-weixin <CODE>
```

Pour le modèle complet de contrôle d’accès, consultez [Appairage](/fr/channels/pairing).

## Compatibilité

Le plugin vérifie la version hôte d’OpenClaw au démarrage.

| Ligne du plugin | Version d’OpenClaw      | Tag npm  |
| --------------- | ----------------------- | -------- |
| `2.x`           | `>=2026.3.22`           | `latest` |
| `1.x`           | `>=2026.1.0 <2026.3.22` | `legacy` |

Si le plugin indique que votre version d’OpenClaw est trop ancienne, mettez à jour
OpenClaw ou installez la ligne de plugin legacy :

```bash
openclaw plugins install @tencent-weixin/openclaw-weixin@legacy
```

## Processus sidecar

Le plugin WeChat peut exécuter des tâches d’assistance à côté du Gateway pendant qu’il surveille
l’API Tencent iLink. Dans l’issue #68451, ce chemin d’assistance a révélé un bug dans le nettoyage générique
des Gateway obsolètes d’OpenClaw : un processus enfant pouvait essayer de nettoyer le processus Gateway
parent, provoquant des boucles de redémarrage sous des gestionnaires de processus comme systemd.

Le nettoyage actuel au démarrage d’OpenClaw exclut le processus courant et ses ancêtres,
donc un assistant de canal ne doit pas tuer le Gateway qui l’a lancé. Ce correctif est
générique ; ce n’est pas un chemin spécifique à WeChat dans le cœur.

## Dépannage

Vérifiez l’installation et l’état :

```bash
openclaw plugins list
openclaw channels status --probe
openclaw --version
```

Si le canal apparaît comme installé mais ne se connecte pas, confirmez que le plugin est
activé, puis redémarrez :

```bash
openclaw config set plugins.entries.openclaw-weixin.enabled true
openclaw gateway restart
```

Si le Gateway redémarre à répétition après l’activation de WeChat, mettez à jour OpenClaw et
le plugin :

```bash
npm view @tencent-weixin/openclaw-weixin version
openclaw plugins install "@tencent-weixin/openclaw-weixin" --force
openclaw gateway restart
```

Si le démarrage indique que le package de plugin installé `requires compiled runtime
output for TypeScript entry`, le package npm a été publié sans les fichiers d’exécution
JavaScript compilés dont OpenClaw a besoin. Mettez à jour ou réinstallez après que l’éditeur
du plugin a publié un package corrigé, ou désactivez/désinstallez temporairement le plugin.

Désactivation temporaire :

```bash
openclaw config set plugins.entries.openclaw-weixin.enabled false
openclaw gateway restart
```

## Documentation associée

- Vue d’ensemble des canaux : [Canaux de discussion](/fr/channels)
- Appairage : [Appairage](/fr/channels/pairing)
- Routage des canaux : [Routage des canaux](/fr/channels/channel-routing)
- Architecture des plugins : [Architecture des plugins](/fr/plugins/architecture)
- SDK de plugin de canal : [SDK de plugin de canal](/fr/plugins/sdk-channel-plugins)
- Package externe : [@tencent-weixin/openclaw-weixin](https://www.npmjs.com/package/@tencent-weixin/openclaw-weixin)
