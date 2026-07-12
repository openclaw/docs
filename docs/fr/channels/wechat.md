---
read_when:
    - Vous souhaitez connecter OpenClaw à WeChat ou Weixin
    - Vous installez ou dépannez le plugin de canal openclaw-weixin
    - Vous devez comprendre comment les plugins de canaux externes fonctionnent aux côtés du Gateway
summary: Configuration du canal WeChat via le Plugin externe openclaw-weixin
title: WeChat
x-i18n:
    generated_at: "2026-07-12T02:39:18Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 98faf95f9fb76deedb7df9adf3092083722a77bdd793de98c41a6f715cc0d14a
    source_path: channels/wechat.md
    workflow: 16
---

OpenClaw se connecte à WeChat par l’intermédiaire du plugin de canal externe
`@tencent-weixin/openclaw-weixin` de Tencent.

Statut : plugin externe, maintenu par l’équipe Tencent Weixin. Les conversations
directes et les médias sont pris en charge. Les conversations de groupe ne sont
pas annoncées dans les métadonnées de capacités du plugin (celui-ci déclare
uniquement les conversations directes).

## Nommage

- **WeChat** est le nom présenté aux utilisateurs dans cette documentation.
- **Weixin** est le nom utilisé par le paquet de Tencent et par l’identifiant du plugin.
- `openclaw-weixin` est l’identifiant de canal OpenClaw (`weixin` et `wechat` fonctionnent comme alias).
- `@tencent-weixin/openclaw-weixin` est le paquet npm.

Utilisez `openclaw-weixin` dans les commandes CLI et les chemins de configuration.

## Fonctionnement

Le code de WeChat ne se trouve pas dans le dépôt principal d’OpenClaw. OpenClaw
fournit le contrat générique des plugins de canal, tandis que le plugin externe
fournit l’environnement d’exécution propre à WeChat :

1. `openclaw plugins install` installe `@tencent-weixin/openclaw-weixin`.
2. Le Gateway détecte le manifeste du plugin et charge son point d’entrée.
3. Le plugin enregistre l’identifiant de canal `openclaw-weixin`.
4. `openclaw channels login --channel openclaw-weixin` lance la connexion par code QR.
5. Le plugin stocke les identifiants du compte dans le répertoire d’état d’OpenClaw
   (`~/.openclaw` par défaut).
6. Au démarrage du Gateway, le plugin lance son moniteur Weixin pour chaque
   compte configuré.
7. Les messages WeChat entrants sont normalisés au moyen du contrat de canal,
   acheminés vers l’agent OpenClaw sélectionné, puis renvoyés par le chemin de
   sortie du plugin.

Cette séparation est importante : le cœur d’OpenClaw reste indépendant des
canaux. La connexion à WeChat, les appels à l’API Tencent iLink, le téléversement
et le téléchargement de médias, les jetons de contexte et la surveillance des
comptes relèvent du plugin externe.

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

Lancez la connexion par code QR sur la même machine que celle qui exécute le
Gateway :

```bash
openclaw channels login --channel openclaw-weixin
```

Scannez le code QR avec WeChat sur votre téléphone et confirmez la connexion. Le
plugin enregistre localement le jeton du compte après une lecture réussie.

Pour ajouter un autre compte WeChat, exécutez de nouveau la même commande de
connexion. Pour plusieurs comptes, isolez les sessions de messages directs selon
le compte, le canal et l’expéditeur :

```bash
openclaw config set session.dmScope per-account-channel-peer
```

## Contrôle d’accès

Les messages directs utilisent le modèle habituel d’appairage et de liste
d’autorisation d’OpenClaw pour les plugins de canal.

Approuvez les nouveaux expéditeurs :

```bash
openclaw pairing list openclaw-weixin
openclaw pairing approve openclaw-weixin <CODE>
```

Pour consulter le modèle complet de contrôle d’accès, voir
[Appairage](/fr/channels/pairing).

## Compatibilité

Le plugin vérifie la version d’OpenClaw hôte au démarrage.

| Branche du plugin | Version d’OpenClaw                                             | Balise npm |
| ----------------- | -------------------------------------------------------------- | ---------- |
| `2.x`             | `>=2026.5.12` (2.4.6 actuelle ; les premières versions 2.x acceptaient `>=2026.3.22`) | `latest` |
| `1.x`             | `>=2026.1.0 <2026.3.22`                                        | `legacy` |

Si le plugin indique que votre version d’OpenClaw est trop ancienne, mettez
OpenClaw à jour ou installez la branche historique du plugin :

```bash
openclaw plugins install @tencent-weixin/openclaw-weixin@legacy
```

## Processus auxiliaire

Le plugin WeChat peut exécuter des tâches auxiliaires en parallèle du Gateway
pendant qu’il surveille l’API Tencent iLink. Dans le ticket nº 68451, ce chemin
auxiliaire a révélé un bogue dans le nettoyage générique des Gateway obsolètes
d’OpenClaw : un processus enfant pouvait tenter de nettoyer le processus Gateway
parent, provoquant des boucles de redémarrage sous des gestionnaires de processus
tels que systemd.

Le nettoyage actuel au démarrage d’OpenClaw exclut le processus en cours et ses
ancêtres ; un auxiliaire de canal ne peut donc pas arrêter le Gateway qui l’a
lancé. Cette correction est générique ; il ne s’agit pas d’un chemin propre à
WeChat dans le cœur.

## Dépannage

Vérifiez l’installation et l’état :

```bash
openclaw plugins list
openclaw channels status --probe
openclaw --version
```

Si le canal apparaît comme installé, mais ne se connecte pas, vérifiez que le
plugin est activé, puis redémarrez :

```bash
openclaw config set plugins.entries.openclaw-weixin.enabled true
openclaw gateway restart
```

Si le Gateway redémarre continuellement après l’activation de WeChat, mettez à
jour OpenClaw et le plugin :

```bash
npm view @tencent-weixin/openclaw-weixin version
openclaw plugins install "@tencent-weixin/openclaw-weixin" --force
openclaw gateway restart
```

Si le démarrage indique que le paquet du plugin installé `requires compiled runtime
output for TypeScript entry`, le paquet npm a été publié sans les fichiers
d’exécution JavaScript compilés dont OpenClaw a besoin. Effectuez une mise à jour
ou une réinstallation après que l’éditeur du plugin a publié un paquet corrigé,
ou désactivez/désinstallez temporairement le plugin.

Désactivation temporaire :

```bash
openclaw config set plugins.entries.openclaw-weixin.enabled false
openclaw gateway restart
```

## Documentation associée

- Vue d’ensemble des canaux : [Canaux de discussion](/fr/channels)
- Appairage : [Appairage](/fr/channels/pairing)
- Acheminement des canaux : [Acheminement des canaux](/fr/channels/channel-routing)
- Architecture des plugins : [Architecture des plugins](/fr/plugins/architecture)
- SDK des plugins de canal : [SDK des plugins de canal](/fr/plugins/sdk-channel-plugins)
- Paquet externe : [@tencent-weixin/openclaw-weixin](https://www.npmjs.com/package/@tencent-weixin/openclaw-weixin)
