---
read_when:
    - Le transport du canal indique qu’il est connecté, mais les réponses échouent
    - Vous devez effectuer des vérifications spécifiques au canal avant la documentation détaillée des fournisseurs
summary: Dépannage rapide au niveau du canal avec signatures d’échec et correctifs par canal
title: Dépannage des canaux
x-i18n:
    generated_at: "2026-06-27T17:13:03Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 56b64030ec56553b4c2e156195806029f91bc8cc449588a242b0f45f8bbddb6e
    source_path: channels/troubleshooting.md
    workflow: 16
---

Utilisez cette page lorsqu’un canal se connecte, mais que le comportement est incorrect.

## Séquence de commandes

Exécutez d’abord celles-ci dans l’ordre :

```bash
openclaw status
openclaw gateway status
openclaw logs --follow
openclaw doctor
openclaw channels status --probe
```

Référence saine :

- `Runtime: running`
- `Connectivity probe: ok`
- `Capability: read-only`, `write-capable`, ou `admin-capable`
- La sonde de canal indique que le transport est connecté et, lorsque c’est pris en charge, `works` ou `audit ok`

## Après une mise à jour

Utilisez ceci lorsque Telegram, iMessage, les configurations de l’ère BlueBubbles ou un autre canal de Plugin disparaît après une mise à jour.

```bash
openclaw status --all
openclaw doctor --fix
openclaw gateway restart
openclaw status --all
```

Recherchez `plugin load failed: dependency tree corrupted; run openclaw doctor
--fix` dans `openclaw status --all`. Cela signifie que le canal est configuré, mais que le chemin de configuration/chargement du Plugin a rencontré un arbre de dépendances corrompu au lieu d’enregistrer le canal. `openclaw doctor --fix` supprime les répertoires obsolètes de préparation des dépendances de Plugin et les ombres d’authentification obsolètes, puis `openclaw gateway restart` recharge l’état propre.

## WhatsApp

### Signatures de panne WhatsApp

| Symptôme                            | Vérification la plus rapide                       | Correctif                                                                                                                           |
| ----------------------------------- | ------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| Connecté, mais aucune réponse en DM | `openclaw pairing list whatsapp`                  | Approuvez l’expéditeur ou changez la politique DM/liste d’autorisation.                                                            |
| Messages de groupe ignorés          | Vérifiez `requireMention` + les motifs de mention dans la configuration | Mentionnez le bot ou assouplissez la politique de mention pour ce groupe.                                                           |
| La connexion QR expire avec 408     | Vérifiez les variables d’environnement `HTTPS_PROXY` / `HTTP_PROXY` du Gateway | Définissez un proxy joignable ; utilisez `NO_PROXY` uniquement pour les contournements.                                             |
| Boucles aléatoires de déconnexion/reconnexion | `openclaw channels status --probe` + journaux | Les reconnexions récentes sont signalées même lorsque la connexion est actuellement établie ; surveillez les journaux, redémarrez le Gateway, puis reliez le compte si les oscillations continuent. |
| Boucle `status=408 Request Time-out` | Sonde, journaux, doctor, puis statut du Gateway   | Corrigez d’abord la connectivité/le timing de l’hôte ; sauvegardez l’authentification et reliez à nouveau le compte si la boucle persiste. |
| Les réponses arrivent avec des secondes/minutes de retard | `openclaw doctor --fix` | Doctor arrête les clients TUI locaux obsolètes vérifiés lorsqu’ils dégradent la boucle d’événements du Gateway.                     |

Dépannage complet : [Dépannage WhatsApp](/fr/channels/whatsapp#troubleshooting)

## Telegram

### Signatures de panne Telegram

| Symptôme                             | Vérification la plus rapide                      | Correctif                                                                                                                    |
| ------------------------------------ | ------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------- |
| `/start`, mais aucun flux de réponse utilisable | `openclaw pairing list telegram`                 | Approuvez l’association ou modifiez la politique DM.                                                                         |
| Bot en ligne, mais le groupe reste silencieux | Vérifiez l’exigence de mention et le mode de confidentialité du bot | Désactivez le mode de confidentialité pour la visibilité du groupe ou mentionnez le bot.                                      |
| Échecs d’envoi avec erreurs réseau   | Inspectez les journaux pour les échecs d’appels à l’API Telegram | Corrigez le routage DNS/IPv6/proxy vers `api.telegram.org`.                                                                  |
| Le démarrage signale `getMe returned 401` | Vérifiez la source de jeton configurée           | Recopiez ou régénérez le jeton BotFather et mettez à jour `botToken`, `tokenFile`, ou le compte par défaut `TELEGRAM_BOT_TOKEN`. |
| L’interrogation se bloque ou se reconnecte lentement | `openclaw logs --follow` pour les diagnostics d’interrogation | Mettez à niveau ; si les redémarrages sont des faux positifs, ajustez `pollingStallThresholdMs`. Les blocages persistants indiquent toujours un problème de proxy/DNS/IPv6. |
| `setMyCommands` rejeté au démarrage | Inspectez les journaux pour `BOT_COMMANDS_TOO_MUCH` | Réduisez les commandes Telegram de Plugin/Skills/personnalisées ou désactivez les menus natifs.                              |
| Après mise à niveau, la liste d’autorisation vous bloque | `openclaw security audit` et listes d’autorisation de configuration | Exécutez `openclaw doctor --fix` ou remplacez `@username` par des ID d’expéditeur numériques.                                |

Dépannage complet : [Dépannage Telegram](/fr/channels/telegram#troubleshooting)

## Discord

### Signatures de panne Discord

| Symptôme                                | Vérification la plus rapide                                                                                                  | Correctif                                                                                                                                                                                                                                                             |
| --------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Bot en ligne, mais aucune réponse de serveur | `openclaw channels status --probe`                                                                                           | Autorisez le serveur/canal et vérifiez l’intention de contenu des messages.                                                                                                                                                                                           |
| Messages de groupe ignorés              | Vérifiez dans les journaux les rejets par filtrage de mention                                                                 | Mentionnez le bot ou définissez `requireMention: false` pour le serveur/canal.                                                                                                                                                                                        |
| Utilisation de saisie/jeton, mais aucun message Discord | Vérifiez s’il s’agit d’un événement de salon ambiant ou d’un salon `message_tool` activé où le modèle a manqué `message(action=send)` | Inspectez le journal détaillé du Gateway pour les métadonnées de charge utile finale supprimées, vérifiez `messages.groupChat.unmentionedInbound`, lisez [Événements de salon ambiant](/fr/channels/ambient-room-events), ou conservez `messages.groupChat.visibleReplies: "automatic"` pour les demandes de groupe normales. |
| Réponses DM manquantes                  | `openclaw pairing list discord`                                                                                              | Approuvez l’association DM ou ajustez la politique DM.                                                                                                                                                                                                                |

Dépannage complet : [Dépannage Discord](/fr/channels/discord#troubleshooting)

## Slack

### Signatures de panne Slack

| Symptôme                              | Vérification la plus rapide                    | Correctif                                                                                                                                                  |
| ------------------------------------- | ---------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Mode socket connecté, mais aucune réponse | `openclaw channels status --probe`             | Vérifiez le jeton d’application + le jeton de bot et les portées requises ; surveillez `botTokenStatus` / `appTokenStatus = configured_unavailable` sur les configurations basées sur SecretRef. |
| DM bloqués                            | `openclaw pairing list slack`                  | Approuvez l’association ou assouplissez la politique DM.                                                                                                    |
| Message de canal ignoré               | Vérifiez `groupPolicy` et la liste d’autorisation du canal | Autorisez le canal ou basculez la politique sur `open`.                                                                                                     |

Dépannage complet : [Dépannage Slack](/fr/channels/slack#troubleshooting)

## iMessage

### Signatures de panne iMessage

| Symptôme                             | Vérification la plus rapide                                  | Correctif                                                              |
| ------------------------------------ | ------------------------------------------------------------ | ---------------------------------------------------------------------- |
| `imsg` absent ou échoue hors macOS   | `openclaw channels status --probe --channel imessage`        | Exécutez OpenClaw sur le Mac Messages ou utilisez un wrapper SSH pour `cliPath`. |
| Peut envoyer, mais ne reçoit rien sur macOS | Vérifiez les autorisations de confidentialité macOS pour l’automatisation de Messages | Réaccordez les autorisations TCC et redémarrez le processus de canal. |
| Expéditeur DM bloqué                 | `openclaw pairing list imessage`                             | Approuvez l’association ou mettez à jour la liste d’autorisation.       |

Dépannage complet :

- [Dépannage iMessage](/fr/channels/imessage#troubleshooting)

## Signal

### Signatures de panne Signal

| Symptôme                         | Vérification la plus rapide              | Correctif                                                |
| -------------------------------- | ---------------------------------------- | -------------------------------------------------------- |
| Démon joignable, mais bot silencieux | `openclaw channels status --probe`       | Vérifiez l’URL/le compte du démon `signal-cli` et le mode de réception. |
| DM bloqué                        | `openclaw pairing list signal`           | Approuvez l’expéditeur ou ajustez la politique DM.       |
| Les réponses de groupe ne se déclenchent pas | Vérifiez la liste d’autorisation du groupe et les motifs de mention | Ajoutez l’expéditeur/le groupe ou assouplissez le filtrage. |

Dépannage complet : [Dépannage Signal](/fr/channels/signal#troubleshooting)

## QQ Bot

### Signatures de panne QQ Bot

| Symptôme                         | Vérification la plus rapide                  | Correctif                                                        |
| -------------------------------- | -------------------------------------------- | ---------------------------------------------------------------- |
| Le bot répond « parti sur Mars » | Vérifiez `appId` et `clientSecret` dans la configuration | Définissez les identifiants ou redémarrez le Gateway.            |
| Aucun message entrant            | `openclaw channels status --probe`           | Vérifiez les identifiants sur QQ Open Platform.                  |
| Voix non transcrite              | Vérifiez la configuration du fournisseur STT | Configurez `channels.qqbot.stt` ou `tools.media.audio`.          |
| Les messages proactifs n’arrivent pas | Vérifiez les exigences d’interaction de la plateforme QQ | QQ peut bloquer les messages initiés par le bot sans interaction récente. |

Dépannage complet : [Dépannage de QQ Bot](/fr/channels/qqbot#troubleshooting)

## Matrix

### Signatures d’échec de Matrix

| Symptôme                           | Vérification la plus rapide            | Correctif                                                                 |
| ---------------------------------- | -------------------------------------- | ------------------------------------------------------------------------- |
| Connecté, mais ignore les messages de salon | `openclaw channels status --probe`     | Vérifiez `groupPolicy`, la liste d’autorisation des salons et le filtrage par mention. |
| Les DM ne sont pas traités         | `openclaw pairing list matrix`         | Approuvez l’expéditeur ou ajustez la politique de DM.                     |
| Les salons chiffrés échouent       | `openclaw matrix verify status`        | Revérifiez l’appareil, puis vérifiez `openclaw matrix verify backup status`. |
| La restauration de sauvegarde est en attente ou cassée | `openclaw matrix verify backup status` | Exécutez `openclaw matrix verify backup restore` ou relancez avec une clé de récupération. |
| La signature croisée/le bootstrap semble incorrect | `openclaw matrix verify bootstrap`     | Réparez le stockage secret, la signature croisée et l’état de la sauvegarde en une seule passe. |

Configuration complète : [Matrix](/fr/channels/matrix)

## Connexe

- [Appairage](/fr/channels/pairing)
- [Routage des canaux](/fr/channels/channel-routing)
- [Dépannage du Gateway](/fr/gateway/troubleshooting)
