---
read_when:
    - Le transport du canal est indiqué comme connecté, mais les réponses échouent
    - Vous devez effectuer des vérifications propres au canal avant de consulter la documentation détaillée du fournisseur.
summary: Dépannage rapide au niveau des canaux avec signatures d’échec et correctifs propres à chaque canal
title: Dépannage des canaux
x-i18n:
    generated_at: "2026-07-12T15:04:40Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: d2699b48ed6ab1f702789d2180daa43aed6ee83023889d0d8821faceb9a943b5
    source_path: channels/troubleshooting.md
    workflow: 16
---

Utilisez cette page lorsqu’un canal se connecte, mais que son comportement est incorrect.

## Séquence de commandes

Exécutez d’abord ces commandes dans l’ordre :

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
- La vérification du canal indique que le transport est connecté et, lorsque cela est pris en charge, `works` ou `audit ok`

## Après une mise à jour

Utilisez cette procédure lorsque Telegram, iMessage, des configurations datant de l’époque de BlueBubbles ou le canal d’un autre plugin disparaît
après une mise à jour.

```bash
openclaw status --all
openclaw doctor --fix
openclaw gateway restart
openclaw status --all
```

Recherchez `plugin load failed: dependency tree corrupted; run openclaw doctor --fix` dans `openclaw
status --all`. Cela signifie que le canal est configuré, mais que la configuration ou le chargement du plugin a rencontré une arborescence de
dépendances corrompue au lieu d’enregistrer le canal. `openclaw doctor --fix` supprime les liens symboliques obsolètes des dépendances
d’exécution du plugin et les doublons d’authentification obsolètes, puis `openclaw gateway restart` recharge
un état propre.

## WhatsApp

### Signatures d’échec de WhatsApp

| Symptôme                             | Vérification la plus rapide                         | Correctif                                                                                                                                                                            |
| ------------------------------------ | --------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Connecté, mais aucune réponse en MP   | `openclaw pairing list whatsapp`                    | Approuvez l’expéditeur ou modifiez la politique ou la liste d’autorisation des MP.                                                                                                   |
| Messages de groupe ignorés           | Vérifiez `requireMention` et les motifs de mention dans la configuration | Mentionnez le bot ou assouplissez la politique de mention pour ce groupe.                                                                                            |
| La connexion par QR expire avec 408  | Vérifiez les variables d’environnement `HTTPS_PROXY` / `HTTP_PROXY` du Gateway | Définissez un proxy accessible ; utilisez `NO_PROXY` uniquement pour les contournements.                                                                            |
| Boucles aléatoires de déconnexion/reconnexion | `openclaw channels status --probe` et les journaux | Les reconnexions récentes sont signalées même lorsque la connexion est actuellement établie ; surveillez les journaux, redémarrez le Gateway, puis réassociez le compte si l’instabilité persiste. |
| Boucle `status=408 Request Time-out`  | Vérification, journaux, doctor, puis état du Gateway | Corrigez d’abord la connectivité ou la temporisation de l’hôte ; sauvegardez l’authentification et réassociez le compte si la boucle persiste.                                      |
| Les réponses arrivent avec plusieurs secondes/minutes de retard | `openclaw doctor --fix` | Doctor arrête les clients TUI locaux obsolètes dont il a été vérifié qu’ils dégradent la boucle d’événements du Gateway.                                                                           |

Dépannage complet : [Dépannage de WhatsApp](/fr/channels/whatsapp#troubleshooting)

## Telegram

### Signatures d’échec de Telegram

| Symptôme                              | Vérification la plus rapide                      | Correctif                                                                                                                                                                         |
| ------------------------------------- | ------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/start`, mais aucun flux de réponse utilisable | `openclaw pairing list telegram`        | Approuvez l’association ou modifiez la politique des MP.                                                                                                                          |
| Bot en ligne, mais groupe silencieux  | Vérifiez l’exigence de mention et le mode de confidentialité du bot | Désactivez le mode de confidentialité pour rendre les messages de groupe visibles ou mentionnez le bot.                                                        |
| Échecs d’envoi avec erreurs réseau    | Consultez les journaux pour repérer les échecs d’appel à l’API Telegram | Corrigez le routage DNS/IPv6/proxy vers `api.telegram.org`.                                                                                                   |
| Le démarrage signale `getMe returned 401` | Vérifiez la source du jeton configurée       | Copiez de nouveau ou régénérez le jeton BotFather et mettez à jour `botToken`, `tokenFile` ou `TELEGRAM_BOT_TOKEN` du compte par défaut.                                             |
| L’interrogation se bloque ou se reconnecte lentement | Consultez `openclaw logs --follow` pour les diagnostics d’interrogation | Effectuez une mise à niveau ; si les redémarrages sont des faux positifs, ajustez `pollingStallThresholdMs`. Les blocages persistants indiquent toujours un problème de proxy/DNS/IPv6. |
| `setMyCommands` rejeté au démarrage   | Recherchez `BOT_COMMANDS_TOO_MUCH` dans les journaux | Réduisez les commandes Telegram des plugins, Skills ou personnalisées, ou désactivez les menus natifs.                                                                         |
| Après la mise à niveau, la liste d’autorisation vous bloque | `openclaw security audit` et les listes d’autorisation de la configuration | Exécutez `openclaw doctor --fix` ou remplacez `@username` par les identifiants numériques des expéditeurs.                              |

Dépannage complet : [Dépannage de Telegram](/fr/channels/telegram#troubleshooting)

## Discord

### Signatures d’échec de Discord

| Symptôme                                   | Vérification la plus rapide                                                                                                                  | Correctif                                                                                                                                                                                                                                                                                                                                                            |
| ------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Bot en ligne, mais aucune réponse dans le serveur | `openclaw channels status --probe`                                                                                                      | Autorisez le serveur/canal et vérifiez l’intention d’accès au contenu des messages.                                                                                                                                                                                                                                                                                   |
| Messages de groupe ignorés                 | Recherchez dans les journaux les rejets dus au filtrage par mention                                                                           | Mentionnez le bot ou définissez `requireMention: false` pour le serveur/canal.                                                                                                                                                                                                                                                                                         |
| Utilisation de l’indicateur de saisie/des jetons, mais aucun message Discord | Vérifiez s’il s’agit d’un événement de salon ambiant ou d’un salon `message_tool` activé dans lequel le modèle n’a pas exécuté `message(action=send)` | Consultez le journal détaillé du Gateway pour rechercher les métadonnées de charge utile finale supprimée, vérifiez `messages.groupChat.unmentionedInbound`, lisez [Événements de salon ambiant](/fr/channels/ambient-room-events) ou conservez `messages.groupChat.visibleReplies: "automatic"` pour les requêtes de groupe normales. |
| Réponses en MP absentes                    | `openclaw pairing list discord`                                                                                                               | Approuvez l’association des MP ou ajustez leur politique.                                                                                                                                                                                                                                                                                                             |

Dépannage complet : [Dépannage de Discord](/fr/channels/discord#troubleshooting)

## Slack

### Signatures d’échec de Slack

| Symptôme                                      | Vérification la plus rapide                  | Correctif                                                                                                                                                                                              |
| --------------------------------------------- | -------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Mode socket connecté, mais aucune réponse     | `openclaw channels status --probe`           | Vérifiez le jeton d’application, le jeton de bot et les portées requises ; surveillez `botTokenStatus` / `appTokenStatus = configured_unavailable` dans les configurations basées sur SecretRef.         |
| MP bloqués                                    | `openclaw pairing list slack`                | Approuvez l’association ou assouplissez la politique des MP.                                                                                                                                           |
| Message de canal ignoré                       | Vérifiez `groupPolicy` et la liste d’autorisation du canal | Autorisez le canal ou définissez la politique sur `open`.                                                                                                                        |

Dépannage complet : [Dépannage de Slack](/fr/channels/slack#troubleshooting)

## iMessage

### Signatures d’échec d’iMessage

| Symptôme                              | Vérification la plus rapide                               | Correctif                                                                                  |
| ------------------------------------- | --------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| `imsg` absent ou défaillant hors macOS | `openclaw channels status --probe --channel imessage`    | Exécutez OpenClaw sur le Mac hébergeant Messages ou utilisez un wrapper SSH pour `cliPath`. |
| Envoi possible, mais aucune réception sous macOS | Vérifiez les autorisations de confidentialité macOS pour l’automatisation de Messages | Accordez de nouveau les autorisations TCC et redémarrez le processus du canal. |
| Expéditeur de MP bloqué               | `openclaw pairing list imessage`                          | Approuvez l’association ou mettez à jour la liste d’autorisation.                           |

Dépannage complet : [Dépannage d’iMessage](/fr/channels/imessage#troubleshooting)

## Signal

### Signatures d’échec de Signal

| Symptôme                              | Vérification la plus rapide                       | Correctif                                                              |
| ------------------------------------- | ------------------------------------------------- | ---------------------------------------------------------------------- |
| Démon accessible, mais bot silencieux | `openclaw channels status --probe`                | Vérifiez l’URL/le compte du démon `signal-cli` et le mode de réception. |
| MP bloqué                             | `openclaw pairing list signal`                    | Approuvez l’expéditeur ou ajustez la politique des MP.                  |
| Les réponses de groupe ne se déclenchent pas | Vérifiez la liste d’autorisation du groupe et les motifs de mention | Ajoutez l’expéditeur/le groupe ou assouplissez le filtrage. |

Dépannage complet : [Dépannage de Signal](/fr/channels/signal#troubleshooting)

## Bot QQ

### Signatures d’échec du bot QQ

| Symptôme                                  | Vérification la plus rapide                            | Correctif                                                                 |
| ----------------------------------------- | ------------------------------------------------------ | ------------------------------------------------------------------------- |
| Le bot répond « gone to Mars »            | Vérifiez `appId` et `clientSecret` dans la configuration | Définissez les identifiants ou redémarrez le Gateway.                    |
| Aucun message entrant                     | `openclaw channels status --probe`                     | Vérifiez les identifiants sur la QQ Open Platform.                        |
| Voix non transcrite                       | Vérifiez la configuration du fournisseur STT           | Configurez `channels.qqbot.stt` ou `tools.media.audio`.                   |
| Les messages proactifs n’arrivent pas     | Vérifiez les exigences d’interaction de la plateforme QQ | QQ peut bloquer les messages initiés par le bot sans interaction récente. |

Dépannage complet : [Dépannage du bot QQ](/fr/channels/qqbot#troubleshooting)

## Matrix

### Signatures d’échec de Matrix

| Symptôme                                        | Vérification la plus rapide             | Correctif                                                                                           |
| ----------------------------------------------- | --------------------------------------- | --------------------------------------------------------------------------------------------------- |
| Connecté, mais les messages des salons sont ignorés | `openclaw channels status --probe`     | Vérifiez `groupPolicy`, la liste d’autorisation des salons et le filtrage des mentions.             |
| Les messages privés ne sont pas traités         | `openclaw pairing list matrix`          | Approuvez l’expéditeur ou ajustez la politique des messages privés.                                 |
| Les salons chiffrés échouent                    | `openclaw matrix verify status`         | Vérifiez de nouveau l’appareil, puis consultez `openclaw matrix verify backup status`.              |
| La restauration de sauvegarde est en attente ou défaillante | `openclaw matrix verify backup status` | Exécutez `openclaw matrix verify backup restore` ou relancez avec une clé de récupération.          |
| La signature croisée ou l’amorçage semble incorrect | `openclaw matrix verify bootstrap`  | Réparez en une seule fois le stockage des secrets, la signature croisée et l’état de la sauvegarde. |

Configuration initiale et paramètres complets : [Matrix](/fr/channels/matrix)

## Pages connexes

- [Appairage](/fr/channels/pairing)
- [Routage des canaux](/fr/channels/channel-routing)
- [Dépannage du Gateway](/fr/gateway/troubleshooting)
