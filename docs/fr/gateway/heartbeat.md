---
read_when:
    - Ajustement de la fréquence ou des messages du Heartbeat
    - Choisir entre Heartbeat et Cron pour les tâches planifiées
sidebarTitle: Heartbeat
summary: Messages d’interrogation Heartbeat et règles de notification
title: Heartbeat
x-i18n:
    generated_at: "2026-07-12T02:36:33Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: bc43539cde0bf4e00ee57d510d2188c4e7cc82d67e13b9f86ac5fc37c3c176d2
    source_path: gateway/heartbeat.md
    workflow: 16
---

<Note>
**Heartbeat ou Cron ?** Consultez [Automatisation](/fr/automation) pour savoir quand utiliser chacun d’eux.
</Note>

Heartbeat exécute des **tours d’agent périodiques** dans la session principale afin que le modèle puisse signaler tout ce qui nécessite une attention particulière sans vous inonder de messages.

Heartbeat est un tour planifié de la session principale : il ne crée **pas** d’enregistrements de [tâche en arrière-plan](/fr/automation/tasks). Les enregistrements de tâches servent aux travaux détachés (exécutions ACP, sous-agents, tâches Cron isolées).

Dépannage : [Tâches planifiées](/fr/automation/cron-jobs#troubleshooting)

## Démarrage rapide (débutant)

<Steps>
  <Step title="Choisir une fréquence">
    Laissez les Heartbeats activés (la valeur par défaut est `30m`, ou `1h` lorsque l’authentification Anthropic par OAuth/jeton est configurée, y compris la réutilisation de la CLI Claude), ou définissez votre propre fréquence.
  </Step>
  <Step title="Ajouter HEARTBEAT.md (facultatif)">
    Créez une courte liste de contrôle `HEARTBEAT.md` ou un bloc `tasks:` dans l’espace de travail de l’agent.
  </Step>
  <Step title="Choisir la destination des messages Heartbeat">
    `target: "none"` est la valeur par défaut ; définissez `target: "last"` pour les acheminer vers le dernier contact.
  </Step>
  <Step title="Réglages facultatifs">
    - Activez la transmission du raisonnement de Heartbeat pour davantage de transparence.
    - Utilisez un contexte d’amorçage léger si les exécutions Heartbeat n’ont besoin que de `HEARTBEAT.md`.
    - Activez les sessions isolées pour éviter d’envoyer l’historique complet de la conversation à chaque Heartbeat.
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
        target: "last", // explicit delivery to last contact (default is "none")
        directPolicy: "allow", // default: allow direct/DM targets; set "block" to suppress
        lightContext: true, // optional: only inject HEARTBEAT.md from bootstrap files
        isolatedSession: true, // optional: fresh session each run (no conversation history)
        skipWhenBusy: true, // optional: also defer when this agent's subagent or nested lanes are busy
        // activeHours: { start: "08:00", end: "24:00" },
        // includeReasoning: true, // optional: send separate `Thinking` message too
      },
    },
  },
}
```

## Valeurs par défaut

- Intervalle : `30m`. L’application des valeurs par défaut du fournisseur Anthropic le porte à `1h` lorsque le mode d’authentification résolu est OAuth/jeton (y compris la réutilisation de la CLI Claude), mais uniquement tant que `heartbeat.every` n’est pas défini. Définissez `agents.defaults.heartbeat.every` ou `agents.list[].heartbeat.every` pour chaque agent ; utilisez `0m` pour le désactiver.
- Corps du prompt (configurable via `agents.defaults.heartbeat.prompt`) : `Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.`
- Délai d’expiration : les tours Heartbeat sans valeur définie utilisent `agents.defaults.timeoutSeconds` lorsque celui-ci est défini. Sinon, ils utilisent la fréquence de Heartbeat, plafonnée à 600 secondes. Définissez `agents.defaults.heartbeat.timeoutSeconds` ou `agents.list[].heartbeat.timeoutSeconds` pour chaque agent afin d’autoriser des travaux Heartbeat plus longs.
- Le prompt Heartbeat est envoyé **tel quel** comme message utilisateur. Le prompt système comprend une section « Heartbeats » uniquement lorsque les Heartbeats sont activés pour l’agent par défaut (et que `includeSystemPromptSection` n’est pas défini sur `false`), et l’exécution est marquée en interne.
- Lorsque les Heartbeats sont désactivés avec `0m`, les exécutions normales omettent également `HEARTBEAT.md` du contexte d’amorçage afin que le modèle ne voie pas les instructions réservées à Heartbeat.
- Les heures d’activité (`heartbeat.activeHours`) sont vérifiées dans le fuseau horaire configuré. En dehors de cette plage, les Heartbeats sont ignorés jusqu’au prochain déclenchement situé dans la plage.
- Les Heartbeats sont automatiquement différés lorsqu’un travail Cron est actif ou en attente. Définissez `heartbeat.skipWhenBusy: true` pour également différer un agent lorsque son propre sous-agent associé à une clé de session ou ses files de commandes imbriquées sont occupés ; les agents frères ne sont plus suspendus simplement parce qu’un autre agent exécute un travail de sous-agent.

## Rôle du prompt Heartbeat

Le prompt par défaut est volontairement général :

- **Tâches en arrière-plan** : « Prendre en compte les tâches en attente » incite l’agent à examiner les suivis (boîte de réception, calendrier, rappels, travaux en attente) et à signaler tout élément urgent.
- **Prise de nouvelles de l’utilisateur** : « Prendre parfois des nouvelles de votre utilisateur pendant la journée » incite à envoyer occasionnellement un bref message du type « avez-vous besoin de quelque chose ? », tout en évitant les messages nocturnes grâce au fuseau horaire local configuré (voir [Fuseau horaire](/fr/concepts/timezone)).

Heartbeat peut réagir aux [tâches en arrière-plan](/fr/automation/tasks) terminées, mais une exécution Heartbeat ne crée pas elle-même d’enregistrement de tâche.

Si vous souhaitez qu’un Heartbeat effectue une action très précise (par exemple « vérifier les statistiques Gmail PubSub » ou « vérifier l’état du Gateway »), définissez `agents.defaults.heartbeat.prompt` (ou `agents.list[].heartbeat.prompt`) avec un corps personnalisé (envoyé tel quel).

## Contrat de réponse

- Si rien ne nécessite d’attention, répondez avec **`HEARTBEAT_OK`**.
- Les exécutions Heartbeat peuvent à la place appeler `heartbeat_respond` avec `notify: false` pour ne produire aucune mise à jour visible, ou avec `notify: true` et `notificationText` pour générer une alerte. Lorsqu’elle est présente, la réponse structurée de l’outil prévaut sur le texte de repli.
- Pendant les exécutions Heartbeat, OpenClaw considère `HEARTBEAT_OK` comme un accusé de réception lorsqu’il apparaît au **début ou à la fin** de la réponse. Le jeton est supprimé et la réponse est abandonnée si le contenu restant comporte **≤ `ackMaxChars`** caractères (valeur par défaut : 300).
- Si `HEARTBEAT_OK` apparaît au **milieu** d’une réponse, il ne fait l’objet d’aucun traitement particulier.
- Pour les alertes, **n’incluez pas** `HEARTBEAT_OK` ; renvoyez uniquement le texte de l’alerte.

En dehors des Heartbeats, tout `HEARTBEAT_OK` isolé au début ou à la fin d’un message est supprimé et journalisé ; un message contenant uniquement `HEARTBEAT_OK` est abandonné.

## Configuration

```json5
{
  agents: {
    defaults: {
      heartbeat: {
        every: "30m", // default: 30m (0m disables)
        model: "anthropic/claude-opus-4-6",
        includeReasoning: false, // default: false (deliver separate Thinking message when available)
        lightContext: false, // default: false; true keeps only HEARTBEAT.md from workspace bootstrap files
        isolatedSession: false, // default: false; true runs each heartbeat in a fresh session (no conversation history)
        skipWhenBusy: false, // default: false; true also waits for this agent's subagent/nested lanes
        target: "last", // default: none | options: last | none | <channel id> (core or plugin, e.g. "imessage")
        to: "+15551234567", // optional channel-specific override
        accountId: "ops-bot", // optional multi-account channel id
        prompt: "Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.",
        includeSystemPromptSection: true, // default: true; false omits the ## Heartbeats system prompt section for the default agent
        ackMaxChars: 300, // max chars allowed after HEARTBEAT_OK
      },
    },
  },
}
```

### Portée et priorité

- `agents.defaults.heartbeat` définit le comportement global de Heartbeat.
- `agents.list[].heartbeat` est fusionné par-dessus ; si un agent possède un bloc `heartbeat`, **seuls ces agents** exécutent des Heartbeats.
- `channels.defaults.heartbeat` définit les valeurs de visibilité par défaut pour tous les canaux.
- `channels.<channel>.heartbeat` remplace les valeurs par défaut du canal.
- `channels.<channel>.accounts.<id>.heartbeat` (canaux multicomptes) remplace les paramètres propres au canal.

### Heartbeats par agent

Si une entrée `agents.list[]` contient un bloc `heartbeat`, **seuls ces agents** exécutent des Heartbeats. Le bloc propre à l’agent est fusionné par-dessus `agents.defaults.heartbeat` (vous pouvez ainsi définir une seule fois les valeurs par défaut communes et les remplacer pour chaque agent).

Exemple : deux agents, seul le second exécute des Heartbeats.

```json5
{
  agents: {
    defaults: {
      heartbeat: {
        every: "30m",
        target: "last", // explicit delivery to last contact (default is "none")
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
          prompt: "Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.",
        },
      },
    ],
  },
}
```

### Exemple d’heures d’activité

Limitez les Heartbeats aux heures de bureau dans un fuseau horaire précis :

```json5
{
  agents: {
    defaults: {
      heartbeat: {
        every: "30m",
        target: "last", // explicit delivery to last contact (default is "none")
        activeHours: {
          start: "09:00",
          end: "22:00",
          timezone: "America/New_York", // optional; uses your userTimezone if set, otherwise host tz
        },
      },
    },
  },
}
```

En dehors de cette plage (avant 9 h ou après 22 h, heure de l’Est), les Heartbeats sont ignorés. Le prochain déclenchement planifié dans la plage s’exécutera normalement.

### Configuration 24 h/24 et 7 j/7

Si vous souhaitez exécuter les Heartbeats toute la journée, utilisez l’un des modèles suivants :

- Omettez entièrement `activeHours` (aucune restriction de plage horaire ; il s’agit du comportement par défaut).
- Définissez une plage couvrant toute la journée : `activeHours: { start: "00:00", end: "24:00" }`.

<Warning>
Ne définissez pas la même heure pour `start` et `end` (par exemple de `08:00` à `08:00`). Cela est interprété comme une plage de largeur nulle ; les Heartbeats sont donc toujours ignorés.
</Warning>

### Exemple multicomptes

Utilisez `accountId` pour cibler un compte précis sur les canaux multicomptes tels que Telegram :

```json5
{
  agents: {
    list: [
      {
        id: "ops",
        heartbeat: {
          every: "1h",
          target: "telegram",
          to: "12345678:topic:42", // optional: route to a specific topic/thread
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
  Intervalle de Heartbeat (chaîne de durée ; unité par défaut = minutes).
</ParamField>
<ParamField path="model" type="string">
  Remplacement facultatif du modèle pour les exécutions Heartbeat (`provider/model`).
</ParamField>
<ParamField path="includeReasoning" type="boolean" default="false">
  Lorsque cette option est activée, transmet également le message `Thinking` distinct lorsqu’il est disponible (même format que `/reasoning on`).
</ParamField>
<ParamField path="lightContext" type="boolean" default="false">
  Lorsque cette option est définie sur vrai, les exécutions Heartbeat utilisent un contexte d’amorçage léger et ne conservent que `HEARTBEAT.md` parmi les fichiers d’amorçage de l’espace de travail.
</ParamField>
<ParamField path="isolatedSession" type="boolean" default="false">
  Lorsque cette option est définie sur vrai, chaque Heartbeat s’exécute dans une nouvelle session sans historique de conversation antérieur. Utilise le même modèle d’isolation que Cron avec `sessionTarget: "isolated"`. Réduit considérablement le coût en jetons de chaque Heartbeat. Associez cette option à `lightContext: true` pour maximiser les économies. L’acheminement de la transmission continue d’utiliser le contexte de la session principale.
</ParamField>
<ParamField path="skipWhenBusy" type="boolean" default="false">
  Lorsque cette option est définie sur vrai, les exécutions Heartbeat sont différées si les files de travail supplémentaires de cet agent sont occupées : son propre sous-agent associé à une clé de session ou ses travaux de commande imbriqués. Les files Cron diffèrent toujours les Heartbeats, même sans cet indicateur, afin que les hôtes de modèles locaux n’exécutent pas simultanément des prompts Cron et Heartbeat.
</ParamField>
<ParamField path="session" type="string">
  Clé de session facultative pour les exécutions Heartbeat.

- `main` (valeur par défaut) : session principale de l’agent.
- Clé de session explicite (copiée depuis `openclaw sessions --json` ou la [CLI des sessions](/fr/cli/sessions)).
- Formats des clés de session : voir [Sessions](/fr/concepts/session) et [Groupes](/fr/channels/groups).

</ParamField>
<ParamField path="target" type="string">
- `last` : transmettre au dernier canal externe utilisé.
- canal explicite : tout canal ou identifiant de Plugin configuré, par exemple `discord`, `matrix`, `telegram` ou `whatsapp`.
- `none` (valeur par défaut) : exécuter le Heartbeat, mais **ne pas le transmettre** à l’extérieur.

</ParamField>
<ParamField path="directPolicy" type='"allow" | "block"' default="allow">
  Contrôle le comportement de transmission directe/par message privé. `allow` : autoriser la transmission directe/par message privé des Heartbeats. `block` : empêcher la transmission directe/par message privé (`reason=dm-blocked`).

</ParamField>
<ParamField path="to" type="string">
  Remplacement facultatif du destinataire (identifiant propre au canal, par exemple E.164 pour WhatsApp ou identifiant de discussion Telegram). Pour les sujets/fils Telegram, utilisez `<chatId>:topic:<messageThreadId>`.

</ParamField>
<ParamField path="accountId" type="string">
  Identifiant de compte facultatif pour les canaux multicomptes. Lorsque `target: "last"`, l'identifiant de compte s'applique au dernier canal résolu s'il prend en charge les comptes ; sinon, il est ignoré. Si l'identifiant de compte ne correspond à aucun compte configuré pour le canal résolu, la livraison est ignorée.

</ParamField>
<ParamField path="prompt" type="string">
  Remplace le corps de l'invite par défaut (sans fusion).

</ParamField>
<ParamField path="includeSystemPromptSection" type="boolean" default="true">
  Indique si la section `## Heartbeats` de l'invite système de l'agent par défaut est injectée. Définissez cette valeur sur `false` pour conserver le comportement d'exécution du Heartbeat (cadence, livraison, HEARTBEAT.md) tout en omettant les instructions de Heartbeat de l'invite système de l'agent.

</ParamField>
<ParamField path="ackMaxChars" type="number" default="300">
  Nombre maximal de caractères autorisés après `HEARTBEAT_OK` avant la livraison.

</ParamField>
<ParamField path="suppressToolErrorWarnings" type="boolean">
  Lorsque cette valeur est vraie, supprime les charges utiles d'avertissement d'erreur d'outil pendant les exécutions de Heartbeat.

</ParamField>
<ParamField path="timeoutSeconds" type="number" default="global timeout or min(every, 600)">
  Nombre maximal de secondes autorisé pour un tour d'agent de Heartbeat avant son abandon. Laissez cette valeur non définie pour utiliser `agents.defaults.timeoutSeconds` lorsqu'elle est définie ; sinon, la cadence du Heartbeat est utilisée, plafonnée à 600 secondes.

</ParamField>
<ParamField path="activeHours" type="object">
  Limite les exécutions de Heartbeat à une plage horaire. Objet comportant `start` (HH:MM, inclusif ; utilisez `00:00` pour le début de la journée), `end` (HH:MM, exclusif ; `24:00` est autorisé pour la fin de la journée) et, éventuellement, `timezone`.

- Valeur omise ou `"user"` : utilise votre `agents.defaults.userTimezone` si elle est définie ; sinon, utilise par défaut le fuseau horaire du système hôte.
- `"local"` : utilise toujours le fuseau horaire du système hôte.
- Tout identifiant IANA (par exemple `America/New_York`) : utilisé directement ; s'il n'est pas valide, le comportement `"user"` décrit ci-dessus est appliqué.
- `start` et `end` ne doivent pas être égaux pour définir une plage active ; des valeurs égales sont traitées comme une plage de largeur nulle (toujours en dehors de la plage).
- En dehors de la plage active, les Heartbeats sont ignorés jusqu'au prochain déclenchement situé dans la plage.

</ParamField>

## Comportement de livraison

<AccordionGroup>
  <Accordion title="Acheminement de la session et de la cible">
    - Par défaut, les Heartbeats s'exécutent dans la session principale de l'agent (`agent:<id>:<mainKey>`), ou dans `global` lorsque `session.scope = "global"`. Définissez `session` pour utiliser à la place une session de canal précise (Discord/WhatsApp/etc.).
    - `session` n'affecte que le contexte d'exécution ; la livraison est contrôlée par `target` et `to`.
    - Pour livrer à un canal ou destinataire précis, définissez `target` + `to`. Avec `target: "last"`, la livraison utilise le dernier canal externe de cette session.
    - Les livraisons de Heartbeat autorisent par défaut les cibles directes/messages privés. Définissez `directPolicy: "block"` pour empêcher les envois vers des cibles directes tout en continuant d'exécuter le tour de Heartbeat.
    - Si la file principale, la voie de la session cible, la voie Cron ou une tâche Cron active est occupée, le Heartbeat est ignoré puis réessayé ultérieurement.
    - Si `skipWhenBusy: true`, les voies des sous-agents associées à la clé de session de cet agent, ainsi que leurs voies imbriquées, reportent également les exécutions de Heartbeat. Les voies occupées des autres agents ne reportent pas celles de cet agent.
    - Si `target` ne correspond à aucune destination externe, l'exécution a tout de même lieu, mais aucun message sortant n'est envoyé.

  </Accordion>
  <Accordion title="Visibilité et comportement d'omission">
    - Si `showOk`, `showAlerts` et `useIndicator` sont tous désactivés, l'exécution est immédiatement ignorée avec `reason=alerts-disabled`.
    - Si seule la livraison des alertes est désactivée, OpenClaw peut tout de même exécuter le Heartbeat, mettre à jour l'horodatage des tâches arrivées à échéance, restaurer l'horodatage d'inactivité de la session et supprimer la charge utile d'alerte sortante.
    - Si la cible de Heartbeat résolue prend en charge l'indicateur de saisie, OpenClaw l'affiche pendant l'exécution du Heartbeat. La cible utilisée est la même que celle à laquelle le Heartbeat enverrait la sortie de discussion, et ce comportement est désactivé par `typingMode: "never"`.

  </Accordion>
  <Accordion title="Cycle de vie de la session et audit">
    - Les réponses provenant uniquement du Heartbeat ne maintiennent **pas** la session active. Les métadonnées du Heartbeat peuvent mettre à jour la ligne de la session, mais l'expiration pour inactivité utilise `lastInteractionAt`, issu du dernier véritable message de l'utilisateur ou du canal, et l'expiration quotidienne utilise `sessionStartedAt`.
    - L'historique de l'interface de contrôle et de WebChat masque les invites de Heartbeat et les accusés de réception contenant uniquement OK. La transcription sous-jacente de la session peut néanmoins conserver ces tours à des fins d'audit ou de relecture.
    - Les [tâches en arrière-plan](/fr/automation/tasks) détachées peuvent mettre un événement système en file d'attente et réveiller le Heartbeat lorsque la session principale doit prendre rapidement connaissance d'un élément. Ce réveil ne transforme pas l'exécution du Heartbeat en tâche en arrière-plan.

  </Accordion>
</AccordionGroup>

## Contrôles de visibilité

Par défaut, les accusés de réception `HEARTBEAT_OK` sont supprimés tandis que le contenu des alertes est livré. Vous pouvez ajuster ce comportement par canal ou par compte :

```yaml
channels:
  defaults:
    heartbeat:
      showOk: false # Masquer HEARTBEAT_OK (par défaut)
      showAlerts: true # Afficher les messages d'alerte (par défaut)
      useIndicator: true # Émettre les événements d'indicateur (par défaut)
  telegram:
    heartbeat:
      showOk: true # Afficher les accusés de réception OK sur Telegram
  whatsapp:
    accounts:
      work:
        heartbeat:
          showAlerts: false # Supprimer la livraison des alertes pour ce compte
```

Priorité : par compte → par canal → valeurs par défaut du canal → valeurs par défaut intégrées.

### Rôle de chaque option

- `showOk` : envoie un accusé de réception `HEARTBEAT_OK` lorsque le modèle renvoie une réponse contenant uniquement OK.
- `showAlerts` : envoie le contenu de l'alerte lorsque le modèle renvoie une réponse autre que OK.
- `useIndicator` : émet des événements d'indicateur pour les surfaces d'état de l'interface utilisateur.

Si les **trois** valeurs sont fausses, OpenClaw ignore entièrement l'exécution du Heartbeat (aucun appel au modèle).

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

### Configurations courantes

| Objectif                                         | Configuration                                                                            |
| ------------------------------------------------ | ---------------------------------------------------------------------------------------- |
| Comportement par défaut (OK silencieux, alertes actives) | _(aucune configuration nécessaire)_                                               |
| Silence total (aucun message ni indicateur)      | `channels.defaults.heartbeat: { showOk: false, showAlerts: false, useIndicator: false }` |
| Indicateur uniquement (aucun message)            | `channels.defaults.heartbeat: { showOk: false, showAlerts: false, useIndicator: true }`  |
| OK dans un seul canal                            | `channels.telegram.heartbeat: { showOk: true }`                                          |

## HEARTBEAT.md (facultatif)

Si un fichier `HEARTBEAT.md` existe dans l'espace de travail, l'invite par défaut demande à l'agent de le lire. Considérez-le comme votre « liste de contrôle du Heartbeat » : concise, stable et sûre à consulter toutes les 30 minutes.

Lors des exécutions normales, `HEARTBEAT.md` n'est injecté que lorsque les instructions de Heartbeat sont activées pour l'agent par défaut. Désactiver la cadence du Heartbeat avec `0m` ou définir `includeSystemPromptSection: false` l'omet du contexte d'amorçage normal.

Dans le moteur Codex natif, le contenu de `HEARTBEAT.md` n'est pas injecté dans le tour comme les autres fichiers d'amorçage. Si le fichier existe et contient autre chose que des espaces, une note relative au mode de collaboration du Heartbeat indique le fichier à Codex et lui demande de le lire avant de continuer.

Si `HEARTBEAT.md` existe, mais est en pratique vide (uniquement des lignes vides, des commentaires Markdown/HTML, des titres Markdown comme `# Heading`, des délimiteurs de blocs ou des ébauches de listes de contrôle vides), OpenClaw ignore l'exécution du Heartbeat afin d'économiser des appels d'API. Cette omission est signalée par `reason=empty-heartbeat-file`. Si le fichier est absent, le Heartbeat s'exécute tout de même et le modèle décide de l'action à entreprendre.

Gardez-le très concis (courte liste de contrôle ou rappels) pour éviter de gonfler l'invite.

Exemple de `HEARTBEAT.md` :

```md
# Liste de contrôle du Heartbeat

- Vérification rapide : y a-t-il quelque chose d'urgent dans les boîtes de réception ?
- S'il fait jour, effectuer une brève prise de contact si rien d'autre n'est en attente.
- Si une tâche est bloquée, noter _ce qui manque_ et interroger Peter la prochaine fois.
```

### Blocs `tasks:`

`HEARTBEAT.md` prend également en charge un petit bloc structuré `tasks:` pour les vérifications par intervalle au sein du Heartbeat lui-même.

Exemple :

```md
tasks:

- name: inbox-triage
  interval: 30m
  prompt: "Vérifier les e-mails urgents non lus et signaler tout élément sensible au temps."
- name: calendar-scan
  interval: 2h
  prompt: "Vérifier les réunions à venir qui nécessitent une préparation ou un suivi."

# Instructions supplémentaires

- Garder les alertes concises.
- Si rien ne nécessite d'attention après toutes les tâches arrivées à échéance, répondre HEARTBEAT_OK.
```

<AccordionGroup>
  <Accordion title="Comportement">
    - OpenClaw analyse le bloc `tasks:` et vérifie chaque tâche selon son propre `interval`.
    - Seules les tâches **arrivées à échéance** sont incluses dans l'invite de Heartbeat pour ce déclenchement.
    - Si aucune tâche n'est arrivée à échéance, le Heartbeat est entièrement ignoré (`reason=no-tasks-due`) afin d'éviter un appel inutile au modèle.
    - Le contenu de `HEARTBEAT.md` qui ne correspond pas à une tâche est conservé et ajouté comme contexte supplémentaire après la liste des tâches arrivées à échéance.
    - Les horodatages de dernière exécution des tâches sont stockés dans l'état de la session (`heartbeatTaskState`), de sorte que les intervalles sont conservés après les redémarrages normaux.
    - Les horodatages des tâches ne sont avancés qu'après qu'une exécution de Heartbeat a terminé son parcours de réponse normal. Les exécutions ignorées avec `empty-heartbeat-file` / `no-tasks-due` ne marquent pas les tâches comme terminées.

  </Accordion>
</AccordionGroup>

Le mode tâche est utile lorsque vous souhaitez qu'un seul fichier de Heartbeat contienne plusieurs vérifications périodiques sans payer pour toutes à chaque déclenchement.

### L'agent peut-il mettre à jour HEARTBEAT.md ?

Oui, si vous le lui demandez.

`HEARTBEAT.md` est simplement un fichier normal de l'espace de travail de l'agent. Vous pouvez donc dire à l'agent (dans une discussion normale), par exemple :

- « Mettre à jour `HEARTBEAT.md` pour ajouter une vérification quotidienne du calendrier. »
- « Réécrire `HEARTBEAT.md` pour le rendre plus concis et axé sur les suivis de la boîte de réception. »

Si vous souhaitez que cela se produise de manière proactive, vous pouvez également inclure une ligne explicite dans votre invite de Heartbeat, par exemple : « Si la liste de contrôle devient obsolète, mettre à jour HEARTBEAT.md avec une meilleure version. »

<Warning>
Ne placez pas de secrets (clés d'API, numéros de téléphone, jetons privés) dans `HEARTBEAT.md` : ils intégreraient le contexte de l'invite.
</Warning>

## Réveil manuel (à la demande)

Utilisez `openclaw system event` pour mettre un événement système en file d'attente et, éventuellement, déclencher immédiatement un Heartbeat :

```bash
openclaw system event --text "Check for urgent follow-ups" --mode now
```

| Option                       | Description                                                                                                          |
| ---------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| `--text <text>`              | Texte de l'événement système (obligatoire).                                                                          |
| `--mode <mode>`              | `now` exécute immédiatement un Heartbeat ; `next-heartbeat` (par défaut) attend le prochain déclenchement planifié. |
| `--session-key <sessionKey>` | Cible une session précise pour l'événement ; utilise par défaut la session principale de l'agent.                   |
| `--json`                     | Produit une sortie JSON.                                                                                             |

Si aucune valeur `--session-key` n'est fournie et que plusieurs agents ont configuré `heartbeat`, `--mode now` exécute immédiatement le Heartbeat de chacun de ces agents.

Commandes de Heartbeat associées dans le même groupe CLI :

```bash
openclaw system heartbeat last     # afficher le dernier événement de Heartbeat
openclaw system heartbeat enable   # activer les Heartbeats
openclaw system heartbeat disable  # désactiver les Heartbeats
```

## Livraison du raisonnement (facultatif)

Par défaut, les Heartbeats transmettent uniquement la charge utile finale « answer ».

Pour plus de transparence, activez :

- `agents.defaults.heartbeat.includeReasoning: true`

Lorsque cette option est activée, les Heartbeats transmettent également un message distinct préfixé par `Thinking` (au même format que `/reasoning on`). Cela peut être utile lorsque l’agent gère plusieurs sessions/codex et que vous souhaitez comprendre pourquoi il a décidé de vous solliciter, mais cela peut aussi révéler davantage de détails internes que vous ne le souhaitez. Il est préférable de laisser cette option désactivée dans les discussions de groupe.

## Maîtrise des coûts

Les Heartbeats exécutent des tours complets de l’agent. Des intervalles plus courts consomment davantage de jetons. Pour réduire les coûts :

- Utilisez `isolatedSession: true` pour éviter d’envoyer l’historique complet de la conversation (d’environ 100 000 jetons à environ 2 000–5 000 par exécution).
- Utilisez `lightContext: true` pour limiter les fichiers d’amorçage au seul fichier `HEARTBEAT.md`.
- Définissez un `model` moins coûteux (par exemple `ollama/llama3.2:1b`).
- Veillez à ce que `HEARTBEAT.md` reste concis.
- Utilisez `target: "none"` si vous souhaitez uniquement des mises à jour de l’état interne.

## Dépassement de la fenêtre de contexte après un Heartbeat

Une fois leur exécution terminée, les Heartbeats conservent le modèle d’exécution existant de la session partagée. Ainsi, un Heartbeat qui a fait passer une session à un modèle local plus petit (par exemple, un modèle Ollama doté d’une fenêtre de 32 000 jetons) peut laisser ce modèle actif pour le tour suivant de la session principale. Si ce tour signale ensuite un dépassement de la fenêtre de contexte et que le dernier modèle d’exécution de la session correspond au `heartbeat.model` configuré, le message de récupération d’OpenClaw indique qu’une persistance du modèle du Heartbeat est probablement à l’origine du problème et suggère une solution.

Pour éviter cela : utilisez `isolatedSession: true` afin d’exécuter les Heartbeats dans une nouvelle session (éventuellement avec `lightContext: true` pour réduire l’invite au minimum), ou choisissez un modèle de Heartbeat doté d’une fenêtre de contexte suffisamment grande pour la session partagée.

## Voir aussi

- [Automatisation](/fr/automation) - vue d’ensemble de tous les mécanismes d’automatisation
- [Tâches en arrière-plan](/fr/automation/tasks) - fonctionnement du suivi des travaux détachés
- [Fuseau horaire](/fr/concepts/timezone) - influence du fuseau horaire sur la planification des Heartbeats
- [Dépannage](/fr/automation/cron-jobs#troubleshooting) - diagnostic des problèmes d’automatisation
