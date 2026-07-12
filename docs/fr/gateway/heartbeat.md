---
read_when:
    - Réglage de la fréquence ou des messages du Heartbeat
    - Choisir entre Heartbeat et Cron pour les tâches planifiées
sidebarTitle: Heartbeat
summary: Messages d’interrogation Heartbeat et règles de notification
title: Heartbeat
x-i18n:
    generated_at: "2026-07-12T15:26:06Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: bc43539cde0bf4e00ee57d510d2188c4e7cc82d67e13b9f86ac5fc37c3c176d2
    source_path: gateway/heartbeat.md
    workflow: 16
---

<Note>
**Heartbeat ou cron ?** Consultez [Automatisation](/fr/automation) pour savoir quand utiliser chacun d’eux.
</Note>

Heartbeat exécute des **tours d’agent périodiques** dans la session principale afin que le modèle puisse signaler tout élément nécessitant votre attention sans vous submerger de messages.

Heartbeat est un tour planifié dans la session principale : il ne crée **pas** d’enregistrements de [tâche en arrière-plan](/fr/automation/tasks). Les enregistrements de tâches sont destinés aux travaux détachés (exécutions ACP, sous-agents, tâches cron isolées).

Dépannage : [Tâches planifiées](/fr/automation/cron-jobs#troubleshooting)

## Démarrage rapide (débutant)

<Steps>
  <Step title="Choisissez une fréquence">
    Laissez les Heartbeats activés (la valeur par défaut est `30m`, ou `1h` lorsque l’authentification OAuth/par jeton d’Anthropic est configurée, y compris la réutilisation de la CLI Claude) ou définissez votre propre fréquence.
  </Step>
  <Step title="Ajoutez HEARTBEAT.md (facultatif)">
    Créez une courte liste de contrôle `HEARTBEAT.md` ou un bloc `tasks:` dans l’espace de travail de l’agent.
  </Step>
  <Step title="Choisissez la destination des messages Heartbeat">
    `target: "none"` est la valeur par défaut ; définissez `target: "last"` pour les acheminer vers le dernier contact.
  </Step>
  <Step title="Réglages facultatifs">
    - Activez l’envoi du raisonnement de Heartbeat pour plus de transparence.
    - Utilisez un contexte d’amorçage léger si les exécutions de Heartbeat nécessitent uniquement `HEARTBEAT.md`.
    - Activez les sessions isolées pour éviter d’envoyer l’intégralité de l’historique de conversation à chaque Heartbeat.
    - Limitez les Heartbeats aux heures d’activité (heure locale).

  </Step>
</Steps>

Exemple de configuration :

```json5
{
  agents: {
    defaults: {
      heartbeat: {
        every: "30m",
        target: "last", // envoi explicite au dernier contact (la valeur par défaut est "none")
        directPolicy: "allow", // valeur par défaut : autoriser les cibles directes/DM ; définir sur "block" pour les supprimer
        lightContext: true, // facultatif : injecter uniquement HEARTBEAT.md depuis les fichiers d’amorçage
        isolatedSession: true, // facultatif : nouvelle session à chaque exécution (aucun historique de conversation)
        skipWhenBusy: true, // facultatif : différer également lorsque le sous-agent de cet agent ou des files imbriquées sont occupés
        // activeHours: { start: "08:00", end: "24:00" },
        // includeReasoning: true, // facultatif : envoyer également un message `Thinking` distinct
      },
    },
  },
}
```

## Valeurs par défaut

- Intervalle : `30m`. L’application des valeurs par défaut du fournisseur Anthropic porte cet intervalle à `1h` lorsque le mode d’authentification résolu est OAuth/jeton (y compris la réutilisation de la CLI Claude), mais uniquement tant que `heartbeat.every` n’est pas défini. Définissez `agents.defaults.heartbeat.every` ou `agents.list[].heartbeat.every` pour chaque agent ; utilisez `0m` pour désactiver.
- Corps de l’invite (configurable via `agents.defaults.heartbeat.prompt`) : `Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.`
- Délai d’expiration : lorsqu’aucun délai n’est défini pour les exécutions Heartbeat, celles-ci utilisent `agents.defaults.timeoutSeconds` s’il est défini. Sinon, elles utilisent la cadence Heartbeat, plafonnée à 600 secondes. Définissez `agents.defaults.heartbeat.timeoutSeconds` ou `agents.list[].heartbeat.timeoutSeconds` pour chaque agent afin d’autoriser des tâches Heartbeat plus longues.
- L’invite Heartbeat est envoyée **mot pour mot** en tant que message utilisateur. L’invite système comprend une section « Heartbeats » uniquement lorsque les Heartbeats sont activés pour l’agent par défaut (et que `includeSystemPromptSection` n’est pas défini sur `false`), et l’exécution est marquée en interne.
- Lorsque les Heartbeats sont désactivés avec `0m`, les exécutions normales omettent également `HEARTBEAT.md` du contexte d’amorçage afin que le modèle ne voie pas les instructions réservées aux Heartbeats.
- Les heures d’activité (`heartbeat.activeHours`) sont vérifiées dans le fuseau horaire configuré. En dehors de cette plage, les Heartbeats sont ignorés jusqu’au prochain déclenchement situé dans la plage.
- Les Heartbeats sont automatiquement différés lorsqu’une tâche Cron est active ou en attente. Définissez `heartbeat.skipWhenBusy: true` pour différer également un agent lorsque son propre sous-agent associé à la clé de session ou ses propres files de commandes imbriquées sont actifs ; les agents frères ne sont plus suspendus simplement parce qu’un autre agent a une tâche de sous-agent en cours.

## À quoi sert l’invite Heartbeat

L’invite par défaut est intentionnellement générale :

- **Tâches en arrière-plan** : « Envisagez les tâches en attente » incite l’agent à examiner les suivis (boîte de réception, calendrier, rappels, travaux en file d’attente) et à signaler tout élément urgent.
- **Prise de nouvelles de l’utilisateur** : « Prenez parfois des nouvelles de votre utilisateur pendant la journée » incite à envoyer occasionnellement un bref message du type « Avez-vous besoin de quelque chose ? », tout en évitant les messages indésirables la nuit grâce à l’utilisation de votre fuseau horaire local configuré (voir [Fuseau horaire](/fr/concepts/timezone)).

Heartbeat peut réagir aux [tâches en arrière-plan](/fr/automation/tasks) terminées, mais une exécution de Heartbeat ne crée pas elle-même d’enregistrement de tâche.

Si vous souhaitez qu’un Heartbeat effectue une tâche très spécifique (par exemple, « vérifier les statistiques PubSub de Gmail » ou « vérifier l’état du Gateway »), définissez `agents.defaults.heartbeat.prompt` (ou `agents.list[].heartbeat.prompt`) sur un contenu personnalisé (envoyé tel quel).

## Contrat de réponse

- Si rien ne nécessite votre attention, répondez avec **`HEARTBEAT_OK`**.
- Les exécutions de Heartbeat peuvent également appeler `heartbeat_respond` avec `notify: false` pour ne publier aucune mise à jour visible, ou avec `notify: true` accompagné de `notificationText` pour déclencher une alerte. Lorsqu’elle est présente, la réponse structurée de l’outil prévaut sur le texte de secours.
- Pendant les exécutions de Heartbeat, OpenClaw interprète `HEARTBEAT_OK` comme un accusé de réception lorsqu’il apparaît au **début ou à la fin** de la réponse. Le jeton est supprimé et la réponse est ignorée si le contenu restant comporte **≤ `ackMaxChars`** caractères (valeur par défaut : 300).
- Si `HEARTBEAT_OK` apparaît au **milieu** d’une réponse, il ne fait l’objet d’aucun traitement particulier.
- Pour les alertes, **n’incluez pas** `HEARTBEAT_OK` ; renvoyez uniquement le texte de l’alerte.

En dehors des Heartbeats, tout `HEARTBEAT_OK` isolé au début ou à la fin d’un message est supprimé et journalisé ; un message contenant uniquement `HEARTBEAT_OK` est ignoré.

## Configuration

```json5
{
  agents: {
    defaults: {
      heartbeat: {
        every: "30m", // valeur par défaut : 30m (0m désactive)
        model: "anthropic/claude-opus-4-6",
        includeReasoning: false, // valeur par défaut : false (envoie un message de réflexion distinct lorsqu’il est disponible)
        lightContext: false, // valeur par défaut : false ; true conserve uniquement HEARTBEAT.md parmi les fichiers d’amorçage de l’espace de travail
        isolatedSession: false, // valeur par défaut : false ; true exécute chaque Heartbeat dans une nouvelle session (sans historique de conversation)
        skipWhenBusy: false, // valeur par défaut : false ; true attend également les voies des sous-agents et voies imbriquées de cet agent
        target: "last", // valeur par défaut : none | options : last | none | <channel id> (noyau ou Plugin, par exemple "imessage")
        to: "+15551234567", // remplacement facultatif propre au canal
        accountId: "ops-bot", // identifiant facultatif du canal pour plusieurs comptes
        prompt: "Lisez HEARTBEAT.md s’il existe (contexte de l’espace de travail). Suivez-le strictement. Ne déduisez pas et ne répétez pas d’anciennes tâches provenant de conversations précédentes. Si rien ne nécessite votre attention, répondez HEARTBEAT_OK.",
        includeSystemPromptSection: true, // valeur par défaut : true ; false omet la section ## Heartbeats de l’invite système pour l’agent par défaut
        ackMaxChars: 300, // nombre maximal de caractères autorisés après HEARTBEAT_OK
      },
    },
  },
}
```

### Portée et priorité

- `agents.defaults.heartbeat` définit le comportement global des Heartbeat.
- `agents.list[].heartbeat` est fusionné par-dessus ; si un agent possède un bloc `heartbeat`, **seuls ces agents** exécutent des Heartbeat.
- `channels.defaults.heartbeat` définit les valeurs de visibilité par défaut pour tous les canaux.
- `channels.<channel>.heartbeat` remplace les valeurs par défaut du canal.
- `channels.<channel>.accounts.<id>.heartbeat` (canaux multicomptes) remplace les paramètres propres au canal.

### Heartbeat par agent

Si une entrée `agents.list[]` inclut un bloc `heartbeat`, **seuls ces agents** exécutent des Heartbeat. Le bloc propre à l’agent est fusionné par-dessus `agents.defaults.heartbeat` (vous pouvez donc définir une seule fois les valeurs par défaut partagées et les remplacer pour chaque agent).

Exemple : deux agents, seul le deuxième exécute des Heartbeat.

```json5
{
  agents: {
    defaults: {
      heartbeat: {
        every: "30m",
        target: "last", // livraison explicite au dernier contact (la valeur par défaut est "none")
      },
    },
    list: [
      { id: "main", default: true },
      {
        id: "ops",
        heartbeat: {
          every: "1h",
          target: "whatsapp",
          to: "+15551234567",
          timeoutSeconds: 45,
          prompt: "Lisez HEARTBEAT.md s’il existe (contexte de l’espace de travail). Suivez-le strictement. Ne déduisez pas et ne répétez pas d’anciennes tâches provenant de discussions précédentes. Si rien ne nécessite votre attention, répondez HEARTBEAT_OK.",
        },
      },
    ],
  },
}
```

### Exemple d’heures d’activité

Limitez les Heartbeat aux heures ouvrées dans un fuseau horaire spécifique :

```json5
{
  agents: {
    defaults: {
      heartbeat: {
        every: "30m",
        target: "last", // livraison explicite au dernier contact (la valeur par défaut est "none")
        activeHours: {
          start: "09:00",
          end: "22:00",
          timezone: "America/New_York", // facultatif ; utilise votre userTimezone s’il est défini, sinon le fuseau horaire de l’hôte
        },
      },
    },
  },
}
```

En dehors de cette plage (avant 9 h ou après 22 h, heure de l’Est), les Heartbeat sont ignorés. Le prochain déclenchement planifié dans cette plage s’exécutera normalement.

### Configuration 24 h/24 et 7 j/7

Si vous souhaitez exécuter les Heartbeat toute la journée, utilisez l’une des configurations suivantes :

- Omettez entièrement `activeHours` (aucune restriction de plage horaire ; il s’agit du comportement par défaut).
- Définissez une plage couvrant toute la journée : `activeHours: { start: "00:00", end: "24:00" }`.

<Warning>
Ne définissez pas la même heure pour `start` et `end` (par exemple de `08:00` à `08:00`). Cette configuration est traitée comme une plage de largeur nulle ; les Heartbeat sont donc toujours ignorés.
</Warning>

### Exemple multicomptes

Utilisez `accountId` pour cibler un compte spécifique sur les canaux multicomptes tels que Telegram :

```json5
{
  agents: {
    list: [
      {
        id: "ops",
        heartbeat: {
          every: "1h",
          target: "telegram",
          to: "12345678:topic:42", // facultatif : acheminer vers un sujet/fil spécifique
          accountId: "ops-bot",
        },
      },
    ],
  },
  channels: {
    telegram: {
      accounts: {
        "ops-bot": { botToken: "YOUR_TELEGRAM_BOT_TOKEN" },
      },
    },
  },
}
```

### Remarques sur les champs

<ParamField path="every" type="string">
  Intervalle du Heartbeat (chaîne de durée ; unité par défaut = minutes).
</ParamField>
<ParamField path="model" type="string">
  Remplacement facultatif du modèle pour les exécutions du Heartbeat (`provider/model`).
</ParamField>
<ParamField path="includeReasoning" type="boolean" default="false">
  Lorsque cette option est activée, envoie également le message `Thinking` séparé lorsqu’il est disponible (même format que `/reasoning on`).
</ParamField>
<ParamField path="lightContext" type="boolean" default="false">
  Lorsque cette option vaut true, les exécutions du Heartbeat utilisent un contexte d’amorçage allégé et ne conservent que `HEARTBEAT.md` parmi les fichiers d’amorçage de l’espace de travail.
</ParamField>
<ParamField path="isolatedSession" type="boolean" default="false">
  Lorsque cette option vaut true, chaque Heartbeat s’exécute dans une nouvelle session sans aucun historique de conversation. Utilise le même modèle d’isolation que le Cron `sessionTarget: "isolated"`. Réduit considérablement le coût en jetons de chaque Heartbeat. Associez-le à `lightContext: true` pour maximiser les économies. L’acheminement de la livraison continue d’utiliser le contexte de la session principale.
</ParamField>
<ParamField path="skipWhenBusy" type="boolean" default="false">
  Lorsque cette option vaut true, les exécutions du Heartbeat sont différées dans les voies occupées supplémentaires de cet agent : le travail de son propre sous-agent associé à une clé de session ou les commandes imbriquées. Les voies du Cron diffèrent toujours les Heartbeat, même sans cet indicateur, afin que les hôtes de modèles locaux n’exécutent pas simultanément les requêtes du Cron et du Heartbeat.
</ParamField>
<ParamField path="session" type="string">
  Clé de session facultative pour les exécutions du Heartbeat.

- `main` (valeur par défaut) : session principale de l’agent.
- Clé de session explicite (copiez-la depuis `openclaw sessions --json` ou la [CLI des sessions](/fr/cli/sessions)).
- Formats des clés de session : consultez [Sessions](/fr/concepts/session) et [Groupes](/fr/channels/groups).

</ParamField>
<ParamField path="target" type="string">
- `last` : livrer au dernier canal externe utilisé.
- canal explicite : tout canal configuré ou identifiant de plugin, par exemple `discord`, `matrix`, `telegram` ou `whatsapp`.
- `none` (valeur par défaut) : exécuter le Heartbeat, mais **ne pas le livrer** à l’extérieur.

</ParamField>
<ParamField path="directPolicy" type='"allow" | "block"' default="allow">
  Contrôle le comportement de livraison directe/par message privé. `allow` : autoriser la livraison directe/par message privé du Heartbeat. `block` : empêcher la livraison directe/par message privé (`reason=dm-blocked`).

</ParamField>
<ParamField path="to" type="string">
  Remplacement facultatif du destinataire (identifiant propre au canal, par exemple E.164 pour WhatsApp ou l’identifiant d’une discussion Telegram). Pour les sujets/fils Telegram, utilisez `<chatId>:topic:<messageThreadId>`.

</ParamField>
<ParamField path="accountId" type="string">
  Identifiant de compte facultatif pour les canaux multicomptes. Lorsque `target: "last"`, l’identifiant de compte s’applique au dernier canal résolu s’il prend en charge les comptes ; sinon, il est ignoré. Si l’identifiant de compte ne correspond à aucun compte configuré pour le canal résolu, la livraison est ignorée.

</ParamField>
<ParamField path="prompt" type="string">
  Remplace le corps du prompt par défaut (sans fusion).

</ParamField>
<ParamField path="includeSystemPromptSection" type="boolean" default="true">
  Indique si la section `## Heartbeats` du prompt système de l’agent par défaut est injectée. Définissez `false` pour conserver le comportement d’exécution du Heartbeat (cadence, livraison, HEARTBEAT.md) tout en omettant les instructions du Heartbeat dans le prompt système de l’agent.

</ParamField>
<ParamField path="ackMaxChars" type="number" default="300">
  Nombre maximal de caractères autorisés après `HEARTBEAT_OK` avant la livraison.

</ParamField>
<ParamField path="suppressToolErrorWarnings" type="boolean">
  Lorsque cette option vaut true, supprime les charges utiles d’avertissement d’erreur d’outil pendant les exécutions du Heartbeat.

</ParamField>
<ParamField path="timeoutSeconds" type="number" default="global timeout or min(every, 600)">
  Nombre maximal de secondes accordé à un tour d’agent Heartbeat avant son abandon. Laissez cette option non définie pour utiliser `agents.defaults.timeoutSeconds` lorsqu’elle est définie ; sinon, la cadence du Heartbeat est utilisée, avec un plafond de 600 secondes.

</ParamField>
<ParamField path="activeHours" type="object">
  Limite les exécutions du Heartbeat à une plage horaire. Objet comportant `start` (HH:MM, inclusif ; utilisez `00:00` pour le début de la journée), `end` (HH:MM, exclusif ; `24:00` est autorisé pour la fin de la journée) et un champ `timezone` facultatif.

- Valeur omise ou `"user"` : utilise votre `agents.defaults.userTimezone` s’il est défini ; sinon, utilise par défaut le fuseau horaire du système hôte.
- `"local"` : utilise toujours le fuseau horaire du système hôte.
- Tout identifiant IANA (par exemple `America/New_York`) : utilisé directement ; s’il est invalide, le comportement `"user"` décrit ci-dessus est appliqué.
- `start` et `end` ne doivent pas être identiques pour une plage active ; des valeurs identiques sont traitées comme une plage de largeur nulle (toujours en dehors de la plage).
- En dehors de la plage active, les Heartbeats sont ignorés jusqu’au prochain déclenchement situé dans la plage.

</ParamField>

## Comportement de livraison

<AccordionGroup>
  <Accordion title="Routage de la session et de la cible">
    - Par défaut, les Heartbeats s’exécutent dans la session principale de l’agent (`agent:<id>:<mainKey>`), ou dans `global` lorsque `session.scope = "global"`. Définissez `session` pour utiliser à la place une session de canal spécifique (Discord/WhatsApp/etc.).
    - `session` affecte uniquement le contexte d’exécution ; la livraison est contrôlée par `target` et `to`.
    - Pour livrer à un canal ou destinataire spécifique, définissez `target` + `to`. Avec `target: "last"`, la livraison utilise le dernier canal externe de cette session.
    - Par défaut, les livraisons du Heartbeat autorisent les cibles directes/messages privés. Définissez `directPolicy: "block"` pour empêcher les envois vers des cibles directes tout en continuant à exécuter le tour du Heartbeat.
    - Si la file principale, la voie de la session cible, la voie Cron ou une tâche Cron active est occupée, le Heartbeat est ignoré et réessayé ultérieurement.
    - Si `skipWhenBusy: true`, les voies de sous-agent indexées par la clé de session de cet agent ainsi que ses voies imbriquées reportent également les exécutions du Heartbeat. Les voies occupées des autres agents ne reportent pas celles de cet agent.
    - Si `target` ne correspond à aucune destination externe, l’exécution a tout de même lieu, mais aucun message sortant n’est envoyé.

  </Accordion>
  <Accordion title="Visibilité et comportement d’omission">
    - Si `showOk`, `showAlerts` et `useIndicator` sont tous désactivés, l’exécution est ignorée immédiatement avec `reason=alerts-disabled`.
    - Si seule la livraison des alertes est désactivée, OpenClaw peut tout de même exécuter le Heartbeat, mettre à jour les horodatages des tâches arrivées à échéance, restaurer l’horodatage d’inactivité de la session et supprimer la charge utile d’alerte sortante.
    - Si la cible résolue du Heartbeat prend en charge l’indicateur de saisie, OpenClaw l’affiche pendant l’exécution du Heartbeat. La même cible que celle à laquelle le Heartbeat enverrait la sortie de discussion est utilisée, et ce comportement est désactivé par `typingMode: "never"`.

  </Accordion>
  <Accordion title="Cycle de vie de la session et audit">
    - Les réponses provenant uniquement du Heartbeat ne maintiennent **pas** la session active. Les métadonnées du Heartbeat peuvent mettre à jour la ligne de session, mais l’expiration pour inactivité utilise `lastInteractionAt` du dernier véritable message d’utilisateur/canal, et l’expiration quotidienne utilise `sessionStartedAt`.
    - L’historique de l’interface de contrôle et de WebChat masque les prompts du Heartbeat et les accusés de réception contenant uniquement OK. La transcription sous-jacente de la session peut néanmoins conserver ces tours à des fins d’audit ou de relecture.
    - Les [tâches en arrière-plan](/fr/automation/tasks) détachées peuvent mettre en file d’attente un événement système et réveiller le Heartbeat lorsque la session principale doit être informée rapidement. Ce réveil ne transforme pas l’exécution du Heartbeat en tâche d’arrière-plan.

  </Accordion>
</AccordionGroup>

## Contrôles de visibilité

Par défaut, les accusés de réception `HEARTBEAT_OK` sont supprimés tandis que le contenu des alertes est livré. Vous pouvez ajuster ce comportement par canal ou par compte :

```yaml
channels:
  defaults:
    heartbeat:
      showOk: false # Masquer HEARTBEAT_OK (par défaut)
      showAlerts: true # Afficher les messages d’alerte (par défaut)
      useIndicator: true # Émettre les événements d’indicateur (par défaut)
  telegram:
    heartbeat:
      showOk: true # Afficher les accusés de réception OK sur Telegram
  whatsapp:
    accounts:
      work:
        heartbeat:
          showAlerts: false # Supprimer la livraison des alertes pour ce compte
```

Ordre de priorité : par compte → par canal → valeurs par défaut du canal → valeurs par défaut intégrées.

### Fonction de chaque option

- `showOk` : envoie un accusé de réception `HEARTBEAT_OK` lorsque le modèle renvoie une réponse contenant uniquement OK.
- `showAlerts` : envoie le contenu de l’alerte lorsque le modèle renvoie une réponse autre que OK.
- `useIndicator` : émet des événements d’indicateur pour les surfaces d’état de l’interface utilisateur.

Si les **trois options** valent false, OpenClaw ignore entièrement l’exécution du Heartbeat (aucun appel au modèle).

### Exemples par canal et par compte

```yaml
channels:
  defaults:
    heartbeat:
      showOk: false
      showAlerts: true
      useIndicator: true
  slack:
    heartbeat:
      showOk: true # tous les comptes Slack
    accounts:
      ops:
        heartbeat:
          showAlerts: false # supprimer les alertes uniquement pour le compte ops
  telegram:
    heartbeat:
      showOk: true
```

### Modèles courants

| Objectif                                           | Configuration                                                                            |
| -------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| Comportement par défaut (OK silencieux, alertes activées) | _(aucune configuration nécessaire)_                                               |
| Entièrement silencieux (aucun message ni indicateur) | `channels.defaults.heartbeat: { showOk: false, showAlerts: false, useIndicator: false }` |
| Indicateur uniquement (aucun message)              | `channels.defaults.heartbeat: { showOk: false, showAlerts: false, useIndicator: true }`  |
| OK dans un seul canal                              | `channels.telegram.heartbeat: { showOk: true }`                                          |

## HEARTBEAT.md (facultatif)

Si un fichier `HEARTBEAT.md` existe dans l’espace de travail, le prompt par défaut demande à l’agent de le lire. Considérez-le comme votre « liste de contrôle du Heartbeat » : courte, stable et sûre à consulter toutes les 30 minutes.

Lors des exécutions normales, `HEARTBEAT.md` est injecté uniquement lorsque les consignes du Heartbeat sont activées pour l’agent par défaut. La désactivation de la cadence du Heartbeat avec `0m` ou la définition de `includeSystemPromptSection: false` l’omet du contexte d’amorçage normal.

Dans le harnais Codex natif, le contenu de `HEARTBEAT.md` n’est pas injecté dans le tour comme les autres fichiers d’amorçage. Si le fichier existe et contient autre chose que des espaces, une note sur le mode de collaboration du Heartbeat indique le fichier à Codex et lui demande de le lire avant de poursuivre.

Si `HEARTBEAT.md` existe mais est effectivement vide (uniquement des lignes vides, des commentaires Markdown/HTML, des titres Markdown comme `# Heading`, des délimiteurs de bloc ou des ébauches de listes de contrôle vides), OpenClaw ignore l’exécution du Heartbeat afin d’économiser des appels d’API. Cette omission est signalée par `reason=empty-heartbeat-file`. Si le fichier est absent, le Heartbeat s’exécute tout de même et le modèle décide de l’action à entreprendre.

Gardez-le très court (brève liste de contrôle ou rappels) afin d’éviter de gonfler le prompt.

Exemple de `HEARTBEAT.md` :

```md
# Liste de contrôle du Heartbeat

- Vérification rapide : y a-t-il quelque chose d’urgent dans les boîtes de réception ?
- S’il fait jour et que rien d’autre n’est en attente, effectuez une vérification légère.
- Si une tâche est bloquée, notez _ce qui manque_ et demandez à Peter la prochaine fois.
```

### Blocs `tasks:`

`HEARTBEAT.md` prend également en charge un petit bloc structuré `tasks:` pour effectuer des vérifications périodiques au sein du Heartbeat lui-même.

Exemple :

```md
tasks:

- name: inbox-triage
  interval: 30m
  prompt: "Recherchez les e-mails urgents non lus et signalez tout élément urgent."
- name: calendar-scan
  interval: 2h
  prompt: "Recherchez les réunions à venir qui nécessitent une préparation ou un suivi."

# Instructions supplémentaires

- Gardez les alertes courtes.
- Si rien ne nécessite d’attention après toutes les tâches arrivées à échéance, répondez HEARTBEAT_OK.
```

<AccordionGroup>
  <Accordion title="Comportement">
    - OpenClaw analyse le bloc `tasks:` et compare chaque tâche à son propre `interval`.
    - Seules les tâches **arrivées à échéance** sont incluses dans le prompt du Heartbeat pour ce déclenchement.
    - Si aucune tâche n’est arrivée à échéance, le Heartbeat est entièrement ignoré (`reason=no-tasks-due`) afin d’éviter un appel inutile au modèle.
    - Le contenu hors tâches de `HEARTBEAT.md` est conservé et ajouté comme contexte supplémentaire après la liste des tâches arrivées à échéance.
    - Les horodatages de dernière exécution des tâches sont stockés dans l’état de session (`heartbeatTaskState`), de sorte que les intervalles persistent après les redémarrages normaux.
    - Les horodatages des tâches ne sont avancés qu’après qu’une exécution du Heartbeat a terminé son chemin de réponse normal. Les exécutions ignorées avec `empty-heartbeat-file` / `no-tasks-due` ne marquent pas les tâches comme terminées.

  </Accordion>
</AccordionGroup>

Le mode tâche est utile lorsque vous souhaitez qu’un seul fichier de Heartbeat contienne plusieurs vérifications périodiques sans payer leur exécution à chaque déclenchement.

### L’agent peut-il mettre à jour HEARTBEAT.md ?

Oui, si vous le lui demandez.

`HEARTBEAT.md` est simplement un fichier normal dans l’espace de travail de l’agent ; vous pouvez donc demander à l’agent (dans une conversation normale), par exemple :

- « Mettez à jour `HEARTBEAT.md` pour ajouter une vérification quotidienne du calendrier. »
- « Réécrivez `HEARTBEAT.md` afin qu’il soit plus court et axé sur le suivi de la boîte de réception. »

Si vous souhaitez que cela se produise de manière proactive, vous pouvez également inclure une ligne explicite dans votre prompt du Heartbeat, par exemple : « Si la liste de contrôle devient obsolète, mettez à jour HEARTBEAT.md avec une meilleure version. »

<Warning>
Ne placez pas de secrets (clés d’API, numéros de téléphone, jetons privés) dans `HEARTBEAT.md` : il est intégré au contexte du prompt.
</Warning>

## Réveil manuel (à la demande)

Utilisez `openclaw system event` pour mettre en file d’attente un événement système et éventuellement déclencher immédiatement un Heartbeat :

```bash
openclaw system event --text "Vérifier les suivis urgents" --mode now
```

| Option                       | Description                                                                                                 |
| ---------------------------- | ----------------------------------------------------------------------------------------------------------- |
| `--text <text>`              | Texte de l’événement système (obligatoire).                                                                 |
| `--mode <mode>`              | `now` exécute immédiatement un Heartbeat ; `next-heartbeat` (par défaut) attend le prochain déclenchement planifié. |
| `--session-key <sessionKey>` | Cible une session spécifique pour l’événement ; utilise par défaut la session principale de l’agent.       |
| `--json`                     | Produit une sortie JSON.                                                                                    |

Si aucune option `--session-key` n’est fournie et que plusieurs agents ont configuré `heartbeat`, `--mode now` exécute immédiatement le Heartbeat de chacun de ces agents.

Contrôles associés au Heartbeat dans le même groupe CLI :

```bash
openclaw system heartbeat last     # afficher le dernier événement du Heartbeat
openclaw system heartbeat enable   # activer les Heartbeats
openclaw system heartbeat disable  # désactiver les Heartbeats
```

## Livraison du raisonnement (facultatif)

Par défaut, les Heartbeats ne transmettent que la charge utile finale de la « réponse ».

Si vous souhaitez davantage de transparence, activez :

- `agents.defaults.heartbeat.includeReasoning: true`

Lorsque cette option est activée, les Heartbeats transmettent également un message distinct préfixé par `Thinking` (au même format que `/reasoning on`). Cela peut être utile lorsque l’agent gère plusieurs sessions/codex et que vous souhaitez comprendre pourquoi il a décidé de vous contacter, mais cela peut aussi divulguer plus de détails internes que vous ne le souhaitez. Il est préférable de laisser cette option désactivée dans les discussions de groupe.

## Maîtrise des coûts

Les Heartbeats exécutent des tours d’agent complets. Des intervalles plus courts consomment davantage de jetons. Pour réduire les coûts :

- Utilisez `isolatedSession: true` afin d’éviter d’envoyer l’intégralité de l’historique de la conversation (d’environ 100 000 jetons à environ 2 000-5 000 par exécution).
- Utilisez `lightContext: true` pour limiter les fichiers d’amorçage au seul fichier `HEARTBEAT.md`.
- Définissez un `model` moins coûteux (par exemple `ollama/llama3.2:1b`).
- Gardez `HEARTBEAT.md` concis.
- Utilisez `target: "none"` si vous souhaitez uniquement des mises à jour de l’état interne.

## Dépassement de la fenêtre de contexte après un Heartbeat

Les Heartbeats conservent le modèle d’exécution existant de la session partagée une fois l’exécution terminée. Ainsi, un Heartbeat qui a fait passer une session à un modèle local plus petit (par exemple, un modèle Ollama doté d’une fenêtre de 32k) peut laisser ce modèle actif pour le prochain tour de la session principale. Si ce tour suivant signale alors un dépassement de la fenêtre de contexte et que le dernier modèle d’exécution de la session correspond au `heartbeat.model` configuré, le message de récupération d’OpenClaw indique que la persistance du modèle du Heartbeat est la cause probable et suggère une solution.

Pour éviter cela : utilisez `isolatedSession: true` afin d’exécuter les Heartbeats dans une nouvelle session (éventuellement avec `lightContext: true` pour obtenir le plus petit prompt possible), ou choisissez un modèle de Heartbeat dont la fenêtre de contexte est suffisamment grande pour la session partagée.

## Voir aussi

- [Automatisation](/fr/automation) - vue d’ensemble de tous les mécanismes d’automatisation
- [Tâches en arrière-plan](/fr/automation/tasks) - fonctionnement du suivi des tâches détachées
- [Fuseau horaire](/fr/concepts/timezone) - influence du fuseau horaire sur la planification des Heartbeats
- [Dépannage](/fr/automation/cron-jobs#troubleshooting) - diagnostic des problèmes d’automatisation
