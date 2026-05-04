---
read_when:
    - Le transport du canal indique qu’il est connecté, mais les réponses échouent
    - Vous avez besoin de vérifications spécifiques au canal avant la documentation détaillée des fournisseurs
summary: Dépannage rapide au niveau des canaux, avec signatures de défaillance et correctifs par canal
title: Dépannage des canaux
x-i18n:
    generated_at: "2026-05-04T02:22:40Z"
    model: gpt-5.5
    provider: openai
    source_hash: a3a0737156ae83897c44d18505e0355a5d8e5700106b984496d94874c270deb2
    source_path: channels/troubleshooting.md
    workflow: 16
---

Utilisez cette page lorsqu’un canal se connecte mais que le comportement est incorrect.

## Séquence de commandes

Exécutez d’abord celles-ci dans l’ordre :

```bash
openclaw status
openclaw gateway status
openclaw logs --follow
openclaw doctor
openclaw channels status --probe
```

État de référence sain :

- `Runtime: running`
- `Connectivity probe: ok`
- `Capability: read-only`, `write-capable` ou `admin-capable`
- La sonde de canal indique que le transport est connecté et, lorsque c’est pris en charge, `works` ou `audit ok`

## WhatsApp

### Signatures d’échec WhatsApp

| Symptôme                                        | Vérification la plus rapide                     | Correctif                                                                                                                              |
| ----------------------------------------------- | ------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------- |
| Connecté, mais aucune réponse aux messages directs | `openclaw pairing list whatsapp`                 | Approuvez l’expéditeur ou modifiez la politique/liste d’autorisation des messages directs.                                             |
| Messages de groupe ignorés                      | Vérifiez `requireMention` + les motifs de mention dans la configuration | Mentionnez le bot ou assouplissez la politique de mention pour ce groupe.                                                              |
| La connexion par QR expire avec 408             | Vérifiez les variables d’environnement Gateway `HTTPS_PROXY` / `HTTP_PROXY` | Définissez un proxy joignable ; utilisez `NO_PROXY` uniquement pour les contournements.                                                 |
| Déconnexions aléatoires/boucles de reconnexion  | `openclaw channels status --probe` + journaux     | Les reconnexions récentes sont signalées même si la connexion est actuellement active ; surveillez les journaux, redémarrez le Gateway, puis reliez à nouveau si l’instabilité continue. |

Dépannage complet : [dépannage WhatsApp](/fr/channels/whatsapp#troubleshooting)

## Telegram

### Signatures d’échec Telegram

| Symptôme                              | Vérification la plus rapide                    | Correctif                                                                                                                        |
| ------------------------------------ | ------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------- |
| `/start`, mais aucun flux de réponse utilisable | `openclaw pairing list telegram`                 | Approuvez l’association ou modifiez la politique des messages directs.                                                      |
| Bot en ligne, mais le groupe reste silencieux | Vérifiez l’exigence de mention et le mode confidentialité du bot | Désactivez le mode confidentialité pour la visibilité dans le groupe ou mentionnez le bot.                                  |
| Échecs d’envoi avec erreurs réseau    | Inspectez les journaux pour les échecs d’appels à l’API Telegram | Corrigez le routage DNS/IPv6/proxy vers `api.telegram.org`.                                                                 |
| Le démarrage indique `getMe returned 401` | Vérifiez la source du jeton configuré          | Recopiez ou régénérez le jeton BotFather et mettez à jour `botToken`, `tokenFile` ou le compte par défaut `TELEGRAM_BOT_TOKEN`. |
| L’interrogation se bloque ou se reconnecte lentement | `openclaw logs --follow` pour les diagnostics d’interrogation | Mettez à niveau ; si les redémarrages sont des faux positifs, ajustez `pollingStallThresholdMs`. Les blocages persistants indiquent toujours un problème de proxy/DNS/IPv6. |
| `setMyCommands` rejeté au démarrage  | Inspectez les journaux pour `BOT_COMMANDS_TOO_MUCH` | Réduisez les commandes Telegram de Plugin/skill/personnalisées ou désactivez les menus natifs.                              |
| Après mise à niveau, la liste d’autorisation vous bloque | `openclaw security audit` et listes d’autorisation de configuration | Exécutez `openclaw doctor --fix` ou remplacez `@username` par des ID d’expéditeur numériques.                              |

Dépannage complet : [dépannage Telegram](/fr/channels/telegram#troubleshooting)

## Discord

### Signatures d’échec Discord

| Symptôme                                   | Vérification la plus rapide                                                          | Correctif                                                                                                                                                                     |
| ----------------------------------------- | ------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Bot en ligne, mais aucune réponse dans la guilde | `openclaw channels status --probe`                                     | Autorisez la guilde/le canal et vérifiez l’intention de contenu des messages.                                                                                                  |
| Messages de groupe ignorés                    | Vérifiez dans les journaux les rejets liés au filtrage par mention                    | Mentionnez le bot ou définissez `requireMention: false` pour la guilde/le canal.                                                                                               |
| Utilisation de saisie/jetons, mais aucun message Discord | Le journal de session affiche le texte de l’assistant avec `didSendViaMessagingTool: false` | Le modèle a répondu en privé au lieu d’appeler l’outil de messagerie. Utilisez un modèle fiable pour les appels d’outils, ou définissez `messages.groupChat.visibleReplies: "automatic"` pour publier automatiquement. |
| Réponses aux messages directs manquantes                        | `openclaw pairing list discord`                                        | Approuvez l’association des messages directs ou ajustez leur politique.                                                                                                        |

Dépannage complet : [dépannage Discord](/fr/channels/discord#troubleshooting)

## Slack

### Signatures d’échec Slack

| Symptôme                                | Vérification la plus rapide                             | Correctif                                                                                                                                                  |
| -------------------------------------- | ------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Mode socket connecté, mais aucune réponse | `openclaw channels status --probe`        | Vérifiez le jeton d’application + le jeton de bot et les portées requises ; surveillez `botTokenStatus` / `appTokenStatus = configured_unavailable` sur les configurations adossées à SecretRef. |
| Messages directs bloqués                            | `openclaw pairing list slack`             | Approuvez l’association ou assouplissez la politique des messages directs.                                                                                  |
| Message de canal ignoré                | Vérifiez `groupPolicy` et la liste d’autorisation du canal | Autorisez le canal ou passez la politique à `open`.                                                                                                        |

Dépannage complet : [dépannage Slack](/fr/channels/slack#troubleshooting)

## iMessage et BlueBubbles

### Signatures d’échec iMessage et BlueBubbles

| Symptôme                          | Vérification la plus rapide                                                           | Correctif                                                   |
| -------------------------------- | ------------------------------------------------------------------------------------- | ----------------------------------------------------------- |
| Aucun événement entrant                | Vérifiez l’accessibilité du webhook/serveur et les permissions de l’application                  | Corrigez l’URL du webhook ou l’état du serveur BlueBubbles. |
| Envoi possible, mais aucune réception sur macOS | Vérifiez les permissions de confidentialité macOS pour l’automatisation de Messages                 | Accordez à nouveau les permissions TCC et redémarrez le processus du canal. |
| Expéditeur de message direct bloqué                | `openclaw pairing list imessage` ou `openclaw pairing list bluebubbles` | Approuvez l’association ou mettez à jour la liste d’autorisation. |

Dépannage complet :

- [dépannage iMessage](/fr/channels/imessage#troubleshooting)
- [dépannage BlueBubbles](/fr/channels/bluebubbles#troubleshooting)

## Signal

### Signatures d’échec Signal

| Symptôme                         | Vérification la plus rapide                              | Correctif                                                      |
| ------------------------------- | -------------------------------------------------------- | -------------------------------------------------------------- |
| Démon joignable, mais bot silencieux | `openclaw channels status --probe`         | Vérifiez l’URL/le compte du démon `signal-cli` et le mode de réception. |
| Message direct bloqué                      | `openclaw pairing list signal`             | Approuvez l’expéditeur ou ajustez la politique des messages directs. |
| Les réponses de groupe ne se déclenchent pas    | Vérifiez la liste d’autorisation du groupe et les motifs de mention | Ajoutez l’expéditeur/le groupe ou assouplissez le filtrage.    |

Dépannage complet : [dépannage Signal](/fr/channels/signal#troubleshooting)

## QQ Bot

### Signatures d’échec QQ Bot

| Symptôme                         | Vérification la plus rapide                               | Correctif                                                             |
| ------------------------------- | --------------------------------------------------------- | --------------------------------------------------------------------- |
| Le bot répond « gone to Mars »      | Vérifiez `appId` et `clientSecret` dans la configuration | Définissez les identifiants ou redémarrez le Gateway.                 |
| Aucun message entrant             | `openclaw channels status --probe`          | Vérifiez les identifiants sur la QQ Open Platform.                    |
| Voix non transcrite           | Vérifiez la configuration du fournisseur STT                   | Configurez `channels.qqbot.stt` ou `tools.media.audio`.               |
| Les messages proactifs n’arrivent pas | Vérifiez les exigences d’interaction de la plateforme QQ  | QQ peut bloquer les messages initiés par le bot sans interaction récente. |

Dépannage complet : [dépannage QQ Bot](/fr/channels/qqbot#troubleshooting)

## Matrix

### Signatures d’échec Matrix

| Symptôme                             | Vérification la plus rapide                          | Correctif                                                                       |
| ----------------------------------- | ---------------------------------------------------- | -------------------------------------------------------------------------------- |
| Connecté, mais ignore les messages de salon | `openclaw channels status --probe`     | Vérifiez `groupPolicy`, la liste d’autorisation du salon et le filtrage par mention. |
| Les messages directs ne sont pas traités                  | `openclaw pairing list matrix`         | Approuvez l’expéditeur ou ajustez la politique des messages directs.             |
| Échec des salons chiffrés                | `openclaw matrix verify status`        | Vérifiez à nouveau l’appareil, puis consultez `openclaw matrix verify backup status`. |
| La restauration de sauvegarde est en attente/défaillante | `openclaw matrix verify backup status` | Exécutez `openclaw matrix verify backup restore` ou relancez avec une clé de récupération. |
| La signature croisée/l’amorçage semble incorrect | `openclaw matrix verify bootstrap`     | Réparez le stockage secret, la signature croisée et l’état de sauvegarde en une seule passe. |

Configuration complète : [Matrix](/fr/channels/matrix)

## Connexe

- [Association](/fr/channels/pairing)
- [Routage des canaux](/fr/channels/channel-routing)
- [Dépannage du Gateway](/fr/gateway/troubleshooting)
