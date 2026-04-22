---
read_when:
    - Le transport du canal indique qu’il est connecté, mais les réponses échouent
    - Vous avez besoin de vérifications spécifiques au canal avant de consulter en profondeur la documentation du Provider
summary: Dépannage rapide au niveau des canaux avec signatures de panne et correctifs par canal
title: Dépannage des canaux
x-i18n:
    generated_at: "2026-04-22T04:20:59Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8c57934b52086ea5f41565c5aae77ef6fa772cf7d56a6427655a844a5c63d1c6
    source_path: channels/troubleshooting.md
    workflow: 15
---

# Dépannage des canaux

Utilisez cette page lorsqu’un canal se connecte mais que le comportement est incorrect.

## Échelle de commandes

Exécutez d’abord celles-ci dans cet ordre :

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

### Signatures de panne WhatsApp

| Symptom                         | Vérification la plus rapide                         | Correctif                                                 |
| ------------------------------- | --------------------------------------------------- | --------------------------------------------------------- |
| Connecté mais aucune réponse en DM | `openclaw pairing list whatsapp`                 | Approuvez l’expéditeur ou changez la politique DM/la liste d’autorisation. |
| Messages de groupe ignorés      | Vérifiez `requireMention` + les modèles de mention dans la config | Mentionnez le bot ou assouplissez la politique de mention pour ce groupe. |
| Boucles aléatoires de déconnexion/reconnexion | `openclaw channels status --probe` + journaux | Reconnectez-vous et vérifiez que le répertoire d’identifiants est sain. |

Dépannage complet : [Dépannage WhatsApp](/fr/channels/whatsapp#troubleshooting)

## Telegram

### Signatures de panne Telegram

| Symptom                             | Vérification la plus rapide                       | Correctif                                                                                                                 |
| ----------------------------------- | ------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| `/start` mais pas de flux de réponse exploitable | `openclaw pairing list telegram`      | Approuvez l’appairage ou modifiez la politique DM.                                                                        |
| Bot en ligne mais groupe silencieux | Vérifiez l’exigence de mention et le mode confidentialité du bot | Désactivez le mode confidentialité pour la visibilité dans les groupes ou mentionnez le bot.                              |
| Échecs d’envoi avec erreurs réseau  | Inspectez les journaux pour les échecs d’appel à l’API Telegram | Corrigez le routage DNS/IPv6/proxy vers `api.telegram.org`.                                                               |
| Le polling se bloque ou se reconnecte lentement | `openclaw logs --follow` pour les diagnostics de polling | Mettez à niveau ; si les redémarrages sont des faux positifs, ajustez `pollingStallThresholdMs`. Les blocages persistants indiquent toujours un problème de proxy/DNS/IPv6. |
| `setMyCommands` rejeté au démarrage | Inspectez les journaux pour `BOT_COMMANDS_TOO_MUCH` | Réduisez les commandes Telegram de plugin/Skills/personnalisées ou désactivez les menus natifs.                          |
| Après une mise à niveau, la liste d’autorisation vous bloque | `openclaw security audit` et les listes d’autorisation de la config | Exécutez `openclaw doctor --fix` ou remplacez `@username` par des identifiants numériques d’expéditeur.                 |

Dépannage complet : [Dépannage Telegram](/fr/channels/telegram#troubleshooting)

## Discord

### Signatures de panne Discord

| Symptom                         | Vérification la plus rapide              | Correctif                                                     |
| ------------------------------- | ---------------------------------------- | ------------------------------------------------------------- |
| Bot en ligne mais aucune réponse dans la guilde | `openclaw channels status --probe` | Autorisez la guilde/le canal et vérifiez l’intention de contenu des messages. |
| Messages de groupe ignorés      | Vérifiez dans les journaux les rejets dus au filtrage par mention | Mentionnez le bot ou définissez `requireMention: false` pour la guilde/le canal. |
| Réponses DM manquantes          | `openclaw pairing list discord`          | Approuvez l’appairage DM ou ajustez la politique DM.          |

Dépannage complet : [Dépannage Discord](/fr/channels/discord#troubleshooting)

## Slack

### Signatures de panne Slack

| Symptom                                | Vérification la plus rapide              | Correctif                                                                                                                                            |
| -------------------------------------- | ---------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| Socket mode connecté mais aucune réponse | `openclaw channels status --probe`     | Vérifiez l’app token + le bot token et les portées requises ; surveillez `botTokenStatus` / `appTokenStatus = configured_unavailable` dans les configurations basées sur SecretRef. |
| DMs bloqués                            | `openclaw pairing list slack`           | Approuvez l’appairage ou assouplissez la politique DM.                                                                                               |
| Message de canal ignoré                | Vérifiez `groupPolicy` et la liste d’autorisation du canal | Autorisez le canal ou remplacez la politique par `open`.                                                                                             |

Dépannage complet : [Dépannage Slack](/fr/channels/slack#troubleshooting)

## iMessage et BlueBubbles

### Signatures de panne iMessage et BlueBubbles

| Symptom                          | Vérification la plus rapide                                        | Correctif                                              |
| -------------------------------- | ------------------------------------------------------------------ | ------------------------------------------------------ |
| Aucun événement entrant          | Vérifiez l’accessibilité du Webhook/serveur et les autorisations de l’application | Corrigez l’URL du Webhook ou l’état du serveur BlueBubbles. |
| Envoi possible mais pas de réception sur macOS | Vérifiez les autorisations de confidentialité macOS pour l’automatisation de Messages | Accordez à nouveau les autorisations TCC et redémarrez le processus du canal. |
| Expéditeur DM bloqué             | `openclaw pairing list imessage` ou `openclaw pairing list bluebubbles` | Approuvez l’appairage ou mettez à jour la liste d’autorisation. |

Dépannage complet :

- [Dépannage iMessage](/fr/channels/imessage#troubleshooting)
- [Dépannage BlueBubbles](/fr/channels/bluebubbles#troubleshooting)

## Signal

### Signatures de panne Signal

| Symptom                         | Vérification la plus rapide             | Correctif                                                |
| ------------------------------- | --------------------------------------- | -------------------------------------------------------- |
| Démon accessible mais bot silencieux | `openclaw channels status --probe`   | Vérifiez l’URL/le compte du démon `signal-cli` et le mode de réception. |
| DM bloqué                       | `openclaw pairing list signal`          | Approuvez l’expéditeur ou ajustez la politique DM.       |
| Les réponses de groupe ne se déclenchent pas | Vérifiez la liste d’autorisation du groupe et les modèles de mention | Ajoutez l’expéditeur/le groupe ou assouplissez le filtrage. |

Dépannage complet : [Dépannage Signal](/fr/channels/signal#troubleshooting)

## Bot QQ

### Signatures de panne du bot QQ

| Symptom                         | Vérification la plus rapide                  | Correctif                                                       |
| ------------------------------- | -------------------------------------------- | --------------------------------------------------------------- |
| Le bot répond « gone to Mars »  | Vérifiez `appId` et `clientSecret` dans la config | Définissez les identifiants ou redémarrez la Gateway.        |
| Aucun message entrant           | `openclaw channels status --probe`           | Vérifiez les identifiants sur la QQ Open Platform.              |
| La voix n’est pas transcrite    | Vérifiez la config du provider STT           | Configurez `channels.qqbot.stt` ou `tools.media.audio`.         |
| Les messages proactifs n’arrivent pas | Vérifiez les exigences d’interaction de la plateforme QQ | QQ peut bloquer les messages initiés par le bot sans interaction récente. |

Dépannage complet : [Dépannage Bot QQ](/fr/channels/qqbot#troubleshooting)

## Matrix

### Signatures de panne Matrix

| Symptom                             | Vérification la plus rapide             | Correctif                                                                   |
| ----------------------------------- | --------------------------------------- | --------------------------------------------------------------------------- |
| Connecté mais ignore les messages de salon | `openclaw channels status --probe` | Vérifiez `groupPolicy`, la liste d’autorisation des salons et le filtrage par mention. |
| Les DMs ne sont pas traités         | `openclaw pairing list matrix`          | Approuvez l’expéditeur ou ajustez la politique DM.                          |
| Les salons chiffrés échouent        | `openclaw matrix verify status`         | Revérifiez l’appareil, puis consultez `openclaw matrix verify backup status`. |
| La restauration de sauvegarde est en attente/en panne | `openclaw matrix verify backup status` | Exécutez `openclaw matrix verify backup restore` ou relancez avec une clé de récupération. |
| Le cross-signing/bootstrap semble incorrect | `openclaw matrix verify bootstrap` | Réparez en un seul passage le stockage des secrets, le cross-signing et l’état de sauvegarde. |

Configuration et paramétrage complets : [Matrix](/fr/channels/matrix)
