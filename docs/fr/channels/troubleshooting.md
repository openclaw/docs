---
read_when:
    - Le transport du canal signale qu’il est connecté, mais les réponses échouent
    - Vous devez effectuer des vérifications propres au canal avant de consulter la documentation approfondie du fournisseur.
summary: Dépannage rapide au niveau des canaux avec signatures de défaillance et correctifs propres à chaque canal
title: Dépannage des canaux
x-i18n:
    generated_at: "2026-05-05T08:25:19Z"
    model: gpt-5.5
    provider: openai
    source_hash: 360184c41ce6929c696688af597c5104a8a28b54620c354f7ee400a2e5490519
    source_path: channels/troubleshooting.md
    workflow: 16
---

Utilisez cette page lorsqu’un canal se connecte, mais que le comportement est incorrect.

## Séquence de commandes

Exécutez d’abord ces commandes dans l’ordre :

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
- `Capability: read-only`, `write-capable` ou `admin-capable`
- La sonde du canal indique que le transport est connecté et, lorsque c’est pris en charge, `works` ou `audit ok`

## WhatsApp

### Signatures d’échec WhatsApp

| Symptôme                           | Vérification la plus rapide                       | Correction                                                                                                                       |
| ---------------------------------- | ------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| Connecté, mais aucune réponse en MP | `openclaw pairing list whatsapp`                  | Approuvez l’expéditeur ou changez la politique/allowlist des MP.                                                                |
| Messages de groupe ignorés         | Vérifiez `requireMention` + les motifs de mention dans la config | Mentionnez le bot ou assouplissez la politique de mention pour ce groupe.                                                       |
| La connexion QR expire avec 408     | Vérifiez les env `HTTPS_PROXY` / `HTTP_PROXY` du Gateway | Définissez un proxy joignable ; utilisez `NO_PROXY` uniquement pour les contournements.                                          |
| Boucles aléatoires de déconnexion/reconnexion | `openclaw channels status --probe` + journaux     | Les reconnexions récentes sont signalées même lorsque la connexion est actuellement active ; surveillez les journaux, redémarrez le Gateway, puis reliez à nouveau si l’instabilité continue. |
| Les réponses arrivent avec des secondes/minutes de retard | `openclaw doctor --fix`                           | Doctor arrête les clients TUI locaux obsolètes vérifiés lorsqu’ils dégradent la boucle d’événements du Gateway.                 |

Dépannage complet : [Dépannage WhatsApp](/fr/channels/whatsapp#troubleshooting)

## Telegram

### Signatures d’échec Telegram

| Symptôme                              | Vérification la plus rapide                    | Correction                                                                                                                     |
| ------------------------------------- | ---------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| `/start`, mais aucun flux de réponse utilisable | `openclaw pairing list telegram`               | Approuvez l’appairage ou changez la politique des MP.                                                                          |
| Bot en ligne, mais le groupe reste silencieux | Vérifiez l’exigence de mention et le mode confidentialité du bot | Désactivez le mode confidentialité pour la visibilité de groupe ou mentionnez le bot.                                           |
| Échecs d’envoi avec erreurs réseau    | Inspectez les journaux pour les échecs d’appels à l’API Telegram | Corrigez le routage DNS/IPv6/proxy vers `api.telegram.org`.                                                                    |
| Le démarrage signale `getMe returned 401` | Vérifiez la source du jeton configurée          | Recopiez ou régénérez le jeton BotFather et mettez à jour `botToken`, `tokenFile` ou le `TELEGRAM_BOT_TOKEN` du compte par défaut. |
| Le polling se bloque ou se reconnecte lentement | `openclaw logs --follow` pour les diagnostics de polling | Mettez à niveau ; si les redémarrages sont des faux positifs, ajustez `pollingStallThresholdMs`. Les blocages persistants indiquent toujours un problème de proxy/DNS/IPv6. |
| `setMyCommands` rejeté au démarrage   | Inspectez les journaux pour `BOT_COMMANDS_TOO_MUCH` | Réduisez les commandes Telegram de Plugin/skill/personnalisées ou désactivez les menus natifs.                                 |
| Après mise à niveau, l’allowlist vous bloque | `openclaw security audit` et allowlists de config | Exécutez `openclaw doctor --fix` ou remplacez `@username` par des ID d’expéditeur numériques.                                  |

Dépannage complet : [Dépannage Telegram](/fr/channels/telegram#troubleshooting)

## Discord

### Signatures d’échec Discord

| Symptôme                                  | Vérification la plus rapide                                      | Correction                                                                                                                                                              |
| ----------------------------------------- | ---------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Bot en ligne, mais aucune réponse dans la guilde | `openclaw channels status --probe`                               | Autorisez la guilde/le canal et vérifiez l’intention de contenu des messages.                                                                                           |
| Messages de groupe ignorés                | Vérifiez les journaux pour les suppressions liées au filtrage par mention | Mentionnez le bot ou définissez `requireMention: false` pour la guilde/le canal.                                                                                        |
| Utilisation de saisie/jetons, mais aucun message Discord | Le journal de session affiche le texte de l’assistant avec `didSendViaMessagingTool: false` | Le modèle a répondu en privé au lieu d’appeler l’outil de messagerie. Utilisez un modèle fiable pour les appels d’outils, ou définissez `messages.groupChat.visibleReplies: "automatic"` pour publier automatiquement. |
| Réponses MP manquantes                    | `openclaw pairing list discord`                                  | Approuvez l’appairage MP ou ajustez la politique des MP.                                                                                                                |

Dépannage complet : [Dépannage Discord](/fr/channels/discord#troubleshooting)

## Slack

### Signatures d’échec Slack

| Symptôme                              | Vérification la plus rapide                | Correction                                                                                                                                          |
| ------------------------------------- | ------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| Socket mode connecté, mais aucune réponse | `openclaw channels status --probe`         | Vérifiez le jeton d’application + le jeton de bot et les portées requises ; surveillez `botTokenStatus` / `appTokenStatus = configured_unavailable` sur les configurations basées sur SecretRef. |
| MP bloqués                            | `openclaw pairing list slack`              | Approuvez l’appairage ou assouplissez la politique des MP.                                                                                          |
| Message de canal ignoré               | Vérifiez `groupPolicy` et l’allowlist du canal | Autorisez le canal ou passez la politique à `open`.                                                                                                 |

Dépannage complet : [Dépannage Slack](/fr/channels/slack#troubleshooting)

## iMessage et BlueBubbles

### Signatures d’échec iMessage et BlueBubbles

| Symptôme                         | Vérification la plus rapide                                        | Correction                                           |
| -------------------------------- | ------------------------------------------------------------------ | ---------------------------------------------------- |
| Aucun événement entrant          | Vérifiez la joignabilité du Webhook/serveur et les autorisations de l’application | Corrigez l’URL du Webhook ou l’état du serveur BlueBubbles. |
| Envoi possible, mais aucune réception sur macOS | Vérifiez les autorisations de confidentialité macOS pour l’automatisation de Messages | Accordez à nouveau les autorisations TCC et redémarrez le processus du canal. |
| Expéditeur MP bloqué             | `openclaw pairing list imessage` ou `openclaw pairing list bluebubbles` | Approuvez l’appairage ou mettez à jour l’allowlist.  |

Dépannage complet :

- [Dépannage iMessage](/fr/channels/imessage#troubleshooting)
- [Dépannage BlueBubbles](/fr/channels/bluebubbles#troubleshooting)

## Signal

### Signatures d’échec Signal

| Symptôme                         | Vérification la plus rapide              | Correction                                                 |
| -------------------------------- | ---------------------------------------- | ---------------------------------------------------------- |
| Démon joignable, mais bot silencieux | `openclaw channels status --probe`       | Vérifiez l’URL/le compte du démon `signal-cli` et le mode de réception. |
| MP bloqué                        | `openclaw pairing list signal`           | Approuvez l’expéditeur ou ajustez la politique des MP.     |
| Les réponses de groupe ne se déclenchent pas | Vérifiez l’allowlist du groupe et les motifs de mention | Ajoutez l’expéditeur/le groupe ou assouplissez le filtrage. |

Dépannage complet : [Dépannage Signal](/fr/channels/signal#troubleshooting)

## QQ Bot

### Signatures d’échec QQ Bot

| Symptôme                         | Vérification la plus rapide                    | Correction                                                    |
| -------------------------------- | ---------------------------------------------- | ------------------------------------------------------------- |
| Le bot répond "gone to Mars"     | Vérifiez `appId` et `clientSecret` dans la config | Définissez les identifiants ou redémarrez le Gateway.         |
| Aucun message entrant            | `openclaw channels status --probe`             | Vérifiez les identifiants sur la QQ Open Platform.            |
| Voix non transcrite              | Vérifiez la config du fournisseur STT          | Configurez `channels.qqbot.stt` ou `tools.media.audio`.       |
| Messages proactifs non reçus     | Vérifiez les exigences d’interaction de la plateforme QQ | QQ peut bloquer les messages initiés par le bot sans interaction récente. |

Dépannage complet : [Dépannage QQ Bot](/fr/channels/qqbot#troubleshooting)

## Matrix

### Signatures d’échec Matrix

| Symptôme                          | Vérification la plus rapide               | Correction                                                                  |
| --------------------------------- | ----------------------------------------- | ---------------------------------------------------------------------------- |
| Connecté, mais ignore les messages de salon | `openclaw channels status --probe`        | Vérifiez `groupPolicy`, l’allowlist des salons et le filtrage par mention.   |
| Les MP ne sont pas traités        | `openclaw pairing list matrix`            | Approuvez l’expéditeur ou ajustez la politique des MP.                       |
| Les salons chiffrés échouent      | `openclaw matrix verify status`           | Vérifiez à nouveau l’appareil, puis vérifiez `openclaw matrix verify backup status`. |
| La restauration de sauvegarde est en attente/cassée | `openclaw matrix verify backup status`    | Exécutez `openclaw matrix verify backup restore` ou relancez avec une clé de récupération. |
| Le cross-signing/bootstrap semble incorrect | `openclaw matrix verify bootstrap`        | Réparez le stockage secret, le cross-signing et l’état de sauvegarde en une seule passe. |

Configuration complète : [Matrix](/fr/channels/matrix)

## Associés

- [Appairage](/fr/channels/pairing)
- [Routage des canaux](/fr/channels/channel-routing)
- [Dépannage du Gateway](/fr/gateway/troubleshooting)
