---
read_when:
    - Ajustement de la cadence du Heartbeat ou des messages
    - Choisir entre Heartbeat et Cron pour les tâches planifiées
sidebarTitle: Heartbeat
summary: Messages d’interrogation Heartbeat et règles de notification
title: Heartbeat
x-i18n:
    generated_at: "2026-05-13T02:53:00Z"
    model: gpt-5.5
    provider: openai
    source_hash: 247a0fe25ef6e47ec447e6c911ac66af4ab669e15dba886c967250b56e9f1a9c
    source_path: gateway/heartbeat.md
    workflow: 16
---

<Note>
**Heartbeat ou cron ?** Consultez [Automatisation](/fr/automation) pour savoir quand utiliser chacun.
</Note>

Heartbeat exécute des **tours périodiques de l’agent** dans la session principale afin que le modèle puisse signaler tout ce qui nécessite de l’attention sans vous spammer.

Heartbeat est un tour planifié dans la session principale — il ne crée **pas** d’enregistrements de [tâche en arrière-plan](/fr/automation/tasks). Les enregistrements de tâches concernent le travail détaché (exécutions ACP, sous-agents, tâches Cron isolées).

Dépannage : [Tâches planifiées](/fr/automation/cron-jobs#troubleshooting)

## Démarrage rapide (débutant)

<Steps>
  <Step title="Choisissez une cadence">
    Laissez les heartbeats activés (la valeur par défaut est `30m`, ou `1h` pour l’authentification OAuth/par jeton Anthropic, y compris la réutilisation de Claude CLI) ou définissez votre propre cadence.
  </Step>
  <Step title="Ajoutez HEARTBEAT.md (facultatif)">
    Créez une petite checklist `HEARTBEAT.md` ou un bloc `tasks:` dans l’espace de travail de l’agent.
  </Step>
  <Step title="Décidez où les messages Heartbeat doivent aller">
    `target: "none"` est la valeur par défaut ; définissez `target: "last"` pour router vers le dernier contact.
  </Step>
  <Step title="Réglages facultatifs">
    - Activez l’envoi du raisonnement Heartbeat pour plus de transparence.
    - Utilisez un contexte d’amorçage léger si les exécutions Heartbeat n’ont besoin que de `HEARTBEAT.md`.
    - Activez les sessions isolées pour éviter d’envoyer tout l’historique de conversation à chaque Heartbeat.
    - Limitez les heartbeats aux heures actives (heure locale).

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
        // includeReasoning: true, // optional: send separate `Reasoning:` message too
      },
    },
  },
}
```

## Valeurs par défaut

- Intervalle : `30m` (ou `1h` lorsque l’authentification OAuth/par jeton Anthropic est le mode d’authentification détecté, y compris la réutilisation de Claude CLI). Définissez `agents.defaults.heartbeat.every` ou `agents.list[].heartbeat.every` par agent ; utilisez `0m` pour désactiver.
- Corps de l’invite (configurable via `agents.defaults.heartbeat.prompt`) : `Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.`
- L’invite Heartbeat est envoyée **verbatim** comme message utilisateur. L’invite système inclut une section « Heartbeat » uniquement lorsque les heartbeats sont activés pour l’agent par défaut, et l’exécution est marquée en interne.
- Lorsque les heartbeats sont désactivés avec `0m`, les exécutions normales omettent aussi `HEARTBEAT.md` du contexte d’amorçage afin que le modèle ne voie pas les instructions propres à Heartbeat.
- Les heures actives (`heartbeat.activeHours`) sont vérifiées dans le fuseau horaire configuré. En dehors de cette fenêtre, les heartbeats sont ignorés jusqu’au prochain tick dans la fenêtre.
- Les heartbeats se reportent automatiquement lorsque du travail Cron est actif ou en file d’attente. Définissez `heartbeat.skipWhenBusy: true` pour reporter aussi un agent sur ses propres voies de sous-agent ou de commande imbriquée indexées par clé de session ; les agents voisins ne se mettent plus en pause simplement parce qu’un autre agent a du travail de sous-agent en cours.

## À quoi sert l’invite Heartbeat

L’invite par défaut est volontairement large :

- **Tâches en arrière-plan** : « Consider outstanding tasks » encourage l’agent à examiner les suivis (boîte de réception, calendrier, rappels, travail en file d’attente) et à signaler tout élément urgent.
- **Prise de nouvelles auprès de l’humain** : « Checkup sometimes on your human during day time » encourage un léger message occasionnel du type « besoin de quelque chose ? », tout en évitant le spam nocturne grâce à votre fuseau horaire local configuré (voir [Fuseau horaire](/fr/concepts/timezone)).

Heartbeat peut réagir à des [tâches en arrière-plan](/fr/automation/tasks) terminées, mais une exécution Heartbeat elle-même ne crée pas d’enregistrement de tâche.

Si vous voulez qu’un Heartbeat fasse quelque chose de très précis (par exemple « vérifier les statistiques Gmail PubSub » ou « vérifier l’état du gateway »), définissez `agents.defaults.heartbeat.prompt` (ou `agents.list[].heartbeat.prompt`) avec un corps personnalisé (envoyé verbatim).

## Contrat de réponse

- Si rien ne nécessite de l’attention, répondez avec **`HEARTBEAT_OK`**.
- Les exécutions Heartbeat capables d’utiliser des outils peuvent à la place appeler `heartbeat_respond` avec `notify: false` pour ne produire aucune mise à jour visible, ou `notify: true` avec `notificationText` pour une alerte. Lorsqu’elle est présente, la réponse structurée de l’outil prévaut sur le texte de secours.
- Pendant les exécutions Heartbeat, OpenClaw traite `HEARTBEAT_OK` comme un accusé de réception lorsqu’il apparaît au **début ou à la fin** de la réponse. Le jeton est supprimé et la réponse est abandonnée si le contenu restant est **≤ `ackMaxChars`** (par défaut : 300).
- Si `HEARTBEAT_OK` apparaît au **milieu** d’une réponse, il n’est pas traité spécialement.
- Pour les alertes, **n’incluez pas** `HEARTBEAT_OK` ; retournez uniquement le texte de l’alerte.

En dehors des heartbeats, un `HEARTBEAT_OK` isolé au début/à la fin d’un message est supprimé et journalisé ; un message qui est uniquement `HEARTBEAT_OK` est abandonné.

## Configuration

```json5
{
  agents: {
    defaults: {
      heartbeat: {
        every: "30m", // default: 30m (0m disables)
        model: "anthropic/claude-opus-4-6",
        includeReasoning: false, // default: false (deliver separate Reasoning: message when available)
        lightContext: false, // default: false; true keeps only HEARTBEAT.md from workspace bootstrap files
        isolatedSession: false, // default: false; true runs each heartbeat in a fresh session (no conversation history)
        skipWhenBusy: false, // default: false; true also waits for this agent's subagent/nested lanes
        target: "last", // default: none | options: last | none | <channel id> (core or plugin, e.g. "imessage")
        to: "+15551234567", // optional channel-specific override
        accountId: "ops-bot", // optional multi-account channel id
        prompt: "Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.",
        ackMaxChars: 300, // max chars allowed after HEARTBEAT_OK
      },
    },
  },
}
```

### Portée et précédence

- `agents.defaults.heartbeat` définit le comportement Heartbeat global.
- `agents.list[].heartbeat` fusionne par-dessus ; si un agent possède un bloc `heartbeat`, **seuls ces agents** exécutent des Heartbeats.
- `channels.defaults.heartbeat` définit les valeurs par défaut de visibilité pour tous les canaux.
- `channels.<channel>.heartbeat` remplace les valeurs par défaut du canal.
- `channels.<channel>.accounts.<id>.heartbeat` (canaux multi-comptes) remplace les paramètres par canal.

### Heartbeats par agent

Si une entrée `agents.list[]` inclut un bloc `heartbeat`, **seuls ces agents** exécutent des Heartbeats. Le bloc par agent fusionne par-dessus `agents.defaults.heartbeat` (vous pouvez donc définir des valeurs par défaut partagées une seule fois et les remplacer par agent).

Exemple : deux agents, seul le second agent exécute des Heartbeats.

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

### Exemple d’heures actives

Limitez les Heartbeats aux heures ouvrées dans un fuseau horaire spécifique :

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

En dehors de cette fenêtre (avant 9 h ou après 22 h, heure de l’Est), les Heartbeats sont ignorés. Le prochain déclenchement planifié à l’intérieur de la fenêtre s’exécutera normalement.

### Configuration 24 h/24, 7 j/7

Si vous voulez que les Heartbeats s’exécutent toute la journée, utilisez l’un de ces modèles :

- Omettez entièrement `activeHours` (aucune restriction de fenêtre horaire ; c’est le comportement par défaut).
- Définissez une fenêtre couvrant toute la journée : `activeHours: { start: "00:00", end: "24:00" }`.

<Warning>
Ne définissez pas la même heure pour `start` et `end` (par exemple de `08:00` à `08:00`). Cela est traité comme une fenêtre de largeur nulle, donc les Heartbeats sont toujours ignorés.
</Warning>

### Exemple multi-compte

Utilisez `accountId` pour cibler un compte spécifique sur les canaux multi-comptes comme Telegram :

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

### Notes sur les champs

<ParamField path="every" type="string">
  Intervalle du Heartbeat (chaîne de durée ; unité par défaut = minutes).
</ParamField>
<ParamField path="model" type="string">
  Remplacement facultatif du modèle pour les exécutions de Heartbeat (`provider/model`).
</ParamField>
<ParamField path="includeReasoning" type="boolean" default="false">
  Lorsque cette option est activée, transmet également le message séparé `Reasoning:` lorsqu’il est disponible (même forme que `/reasoning on`).
</ParamField>
<ParamField path="lightContext" type="boolean" default="false">
  Lorsque la valeur est true, les exécutions de Heartbeat utilisent un contexte d’amorçage léger et ne conservent que `HEARTBEAT.md` parmi les fichiers d’amorçage de l’espace de travail.
</ParamField>
<ParamField path="isolatedSession" type="boolean" default="false">
  Lorsque la valeur est true, chaque Heartbeat s’exécute dans une nouvelle session sans historique de conversation antérieur. Utilise le même modèle d’isolation que Cron `sessionTarget: "isolated"`. Réduit fortement le coût en jetons par Heartbeat. Combinez avec `lightContext: true` pour des économies maximales. Le routage de la livraison utilise toujours le contexte de la session principale.
</ParamField>
<ParamField path="skipWhenBusy" type="boolean" default="false">
  Lorsque la valeur est true, les exécutions de Heartbeat sont différées sur les voies très occupées supplémentaires de cet agent : son propre sous-agent indexé par clé de session ou le travail de commande imbriqué. Les voies Cron différent toujours les Heartbeats, même sans cet indicateur, afin que les hôtes de modèles locaux n’exécutent pas les invites Cron et Heartbeat en même temps.
</ParamField>
<ParamField path="session" type="string">
  Clé de session facultative pour les exécutions de Heartbeat.

- `main` (par défaut) : session principale de l’agent.
- Clé de session explicite (copiez-la depuis `openclaw sessions --json` ou la [CLI des sessions](/fr/cli/sessions)).
- Formats de clé de session : consultez [Sessions](/fr/concepts/session) et [Groupes](/fr/channels/groups).

</ParamField>
<ParamField path="target" type="string">
- `last` : livrer au dernier canal externe utilisé.
- canal explicite : tout canal configuré ou id de plugin, par exemple `discord`, `matrix`, `telegram` ou `whatsapp`.
- `none` (par défaut) : exécuter le Heartbeat mais **ne pas le livrer** en externe.

</ParamField>
<ParamField path="directPolicy" type='"allow" | "block"' default="allow">
  Contrôle le comportement de livraison directe/DM. `allow` : autoriser la livraison directe/DM du Heartbeat. `block` : supprimer la livraison directe/DM (`reason=dm-blocked`).

</ParamField>
<ParamField path="to" type="string">
  Remplacement facultatif du destinataire (id propre au canal, par exemple E.164 pour WhatsApp ou un id de discussion Telegram). Pour les sujets/fils Telegram, utilisez `<chatId>:topic:<messageThreadId>`.

</ParamField>
<ParamField path="accountId" type="string">
  Id de compte facultatif pour les canaux multi-comptes. Lorsque `target: "last"`, l’id de compte s’applique au dernier canal résolu s’il prend en charge les comptes ; sinon, il est ignoré. Si l’id de compte ne correspond à aucun compte configuré pour le canal résolu, la livraison est ignorée.

</ParamField>
<ParamField path="prompt" type="string">
  Remplace le corps de prompt par défaut (non fusionné).

</ParamField>
<ParamField path="ackMaxChars" type="number" default="300">
  Nombre maximal de caractères autorisés après `HEARTBEAT_OK` avant la livraison.

</ParamField>
<ParamField path="suppressToolErrorWarnings" type="boolean">
  Quand cette option vaut true, supprime les charges utiles d’avertissement d’erreur d’outil pendant les exécutions Heartbeat.

</ParamField>
<ParamField path="activeHours" type="object">
  Restreint les exécutions Heartbeat à une fenêtre horaire. Objet avec `start` (HH:MM, inclusif ; utilisez `00:00` pour le début de journée), `end` (HH:MM exclusif ; `24:00` autorisé pour la fin de journée), et `timezone` facultatif.

- Omis ou `"user"` : utilise votre `agents.defaults.userTimezone` si défini, sinon revient au fuseau horaire du système hôte.
- `"local"` : utilise toujours le fuseau horaire du système hôte.
- Tout identifiant IANA (par exemple `America/New_York`) : utilisé directement ; s’il est invalide, revient au comportement `"user"` ci-dessus.
- `start` et `end` ne doivent pas être égaux pour une fenêtre active ; les valeurs égales sont traitées comme une largeur nulle (toujours hors de la fenêtre).
- En dehors de la fenêtre active, les Heartbeats sont ignorés jusqu’au prochain tick dans la fenêtre.

</ParamField>

## Comportement de livraison

<AccordionGroup>
  <Accordion title="Routage de session et de cible">
    - Les Heartbeats s’exécutent par défaut dans la session principale de l’agent (`agent:<id>:<mainKey>`), ou `global` quand `session.scope = "global"`. Définissez `session` pour remplacer par une session de canal précise (Discord/WhatsApp/etc.).
    - `session` affecte uniquement le contexte d’exécution ; la livraison est contrôlée par `target` et `to`.
    - Pour livrer à un canal/destinataire précis, définissez `target` + `to`. Avec `target: "last"`, la livraison utilise le dernier canal externe pour cette session.
    - Les livraisons Heartbeat autorisent par défaut les cibles directes/DM. Définissez `directPolicy: "block"` pour supprimer les envois vers des cibles directes tout en exécutant quand même le tour Heartbeat.
    - Si la file principale, la voie de session cible, la voie Cron ou une tâche Cron active est occupée, le Heartbeat est ignoré et réessayé plus tard.
    - Si `skipWhenBusy: true`, le sous-agent indexé par clé de session de cet agent et les voies imbriquées reportent aussi les exécutions Heartbeat. Les voies occupées des autres agents ne reportent pas cet agent.
    - Si `target` ne se résout vers aucune destination externe, l’exécution a quand même lieu, mais aucun message sortant n’est envoyé.

  </Accordion>
  <Accordion title="Visibilité et comportement d’ignorance">
    - Si `showOk`, `showAlerts` et `useIndicator` sont tous désactivés, l’exécution est ignorée dès le départ avec `reason=alerts-disabled`.
    - Si seule la livraison des alertes est désactivée, OpenClaw peut quand même exécuter le Heartbeat, mettre à jour les horodatages des tâches dues, restaurer l’horodatage d’inactivité de la session et supprimer la charge utile d’alerte sortante.
    - Si la cible Heartbeat résolue prend en charge la saisie, OpenClaw affiche la saisie pendant que l’exécution Heartbeat est active. Cela utilise la même cible à laquelle le Heartbeat enverrait la sortie de chat, et c’est désactivé par `typingMode: "never"`.

  </Accordion>
  <Accordion title="Cycle de vie de session et audit">
    - Les réponses Heartbeat uniquement ne gardent **pas** la session active. Les métadonnées Heartbeat peuvent mettre à jour la ligne de session, mais l’expiration par inactivité utilise `lastInteractionAt` depuis le dernier vrai message utilisateur/canal, et l’expiration quotidienne utilise `sessionStartedAt`.
    - L’interface de contrôle et l’historique WebChat masquent les prompts Heartbeat et les accusés de réception OK uniquement. La transcription de session sous-jacente peut encore contenir ces tours pour l’audit/la relecture.
    - Les [tâches en arrière-plan](/fr/automation/tasks) détachées peuvent mettre en file un événement système et réveiller Heartbeat lorsque la session principale doit remarquer rapidement quelque chose. Ce réveil ne transforme pas l’exécution Heartbeat en tâche en arrière-plan.

  </Accordion>
</AccordionGroup>

## Contrôles de visibilité

Par défaut, les accusés de réception `HEARTBEAT_OK` sont supprimés tandis que le contenu d’alerte est livré. Vous pouvez ajuster cela par canal ou par compte :

```yaml
channels:
  defaults:
    heartbeat:
      showOk: false # Hide HEARTBEAT_OK (default)
      showAlerts: true # Show alert messages (default)
      useIndicator: true # Emit indicator events (default)
  telegram:
    heartbeat:
      showOk: true # Show OK acknowledgments on Telegram
  whatsapp:
    accounts:
      work:
        heartbeat:
          showAlerts: false # Suppress alert delivery for this account
```

Précédence : par compte → par canal → valeurs par défaut du canal → valeurs par défaut intégrées.

### Effet de chaque indicateur

- `showOk` : envoie un accusé de réception `HEARTBEAT_OK` lorsque le modèle renvoie une réponse OK uniquement.
- `showAlerts` : envoie le contenu d’alerte lorsque le modèle renvoie une réponse non OK.
- `useIndicator` : émet des événements d’indicateur pour les surfaces d’état de l’interface.

Si **les trois** valent false, OpenClaw ignore entièrement l’exécution Heartbeat (aucun appel au modèle).

### Exemples par canal ou par compte

```yaml
channels:
  defaults:
    heartbeat:
      showOk: false
      showAlerts: true
      useIndicator: true
  slack:
    heartbeat:
      showOk: true # all Slack accounts
    accounts:
      ops:
        heartbeat:
          showAlerts: false # suppress alerts for the ops account only
  telegram:
    heartbeat:
      showOk: true
```

### Motifs courants

| Objectif                                      | Configuration                                                                            |
| --------------------------------------------- | ---------------------------------------------------------------------------------------- |
| Comportement par défaut (OK silencieux, alertes activées) | _(aucune configuration nécessaire)_                                                      |
| Totalement silencieux (aucun message, aucun indicateur) | `channels.defaults.heartbeat: { showOk: false, showAlerts: false, useIndicator: false }` |
| Indicateur uniquement (aucun message)         | `channels.defaults.heartbeat: { showOk: false, showAlerts: false, useIndicator: true }`  |
| OK dans un seul canal                         | `channels.telegram.heartbeat: { showOk: true }`                                          |

## HEARTBEAT.md (facultatif)

Si un fichier `HEARTBEAT.md` existe dans l’espace de travail, le prompt par défaut demande à l’agent de le lire. Considérez-le comme votre « liste de contrôle Heartbeat » : petite, stable et sûre à inclure toutes les 30 minutes.

Lors des exécutions normales, `HEARTBEAT.md` est injecté uniquement lorsque les instructions Heartbeat sont activées pour l’agent par défaut. Désactiver la cadence Heartbeat avec `0m` ou définir `includeSystemPromptSection: false` l’omet du contexte d’amorçage normal.

Si `HEARTBEAT.md` existe mais est effectivement vide (seulement des lignes vides et des en-têtes Markdown comme `# Heading`), OpenClaw ignore l’exécution Heartbeat pour économiser des appels API. Cette ignorance est signalée avec `reason=empty-heartbeat-file`. Si le fichier est absent, le Heartbeat s’exécute quand même et le modèle décide quoi faire.

Gardez-le minuscule (courte liste de contrôle ou rappels) pour éviter de gonfler le prompt.

Exemple de `HEARTBEAT.md` :

```md
# Heartbeat checklist

- Quick scan: anything urgent in inboxes?
- If it's daytime, do a lightweight check-in if nothing else is pending.
- If a task is blocked, write down _what is missing_ and ask Peter next time.
```

### Blocs `tasks:`

`HEARTBEAT.md` prend aussi en charge un petit bloc structuré `tasks:` pour les vérifications basées sur des intervalles dans Heartbeat lui-même.

Exemple :

```md
tasks:

- name: inbox-triage
  interval: 30m
  prompt: "Check for urgent unread emails and flag anything time sensitive."
- name: calendar-scan
  interval: 2h
  prompt: "Check for upcoming meetings that need prep or follow-up."

# Additional instructions

- Keep alerts short.
- If nothing needs attention after all due tasks, reply HEARTBEAT_OK.
```

<AccordionGroup>
  <Accordion title="Comportement">
    - OpenClaw analyse le bloc `tasks:` et vérifie chaque tâche selon son propre `interval`.
    - Seules les tâches **dues** sont incluses dans le prompt Heartbeat pour ce tick.
    - Si aucune tâche n’est due, le Heartbeat est entièrement ignoré (`reason=no-tasks-due`) afin d’éviter un appel au modèle inutile.
    - Le contenu hors tâche dans `HEARTBEAT.md` est préservé et ajouté comme contexte supplémentaire après la liste des tâches dues.
    - Les horodatages de dernière exécution des tâches sont stockés dans l’état de session (`heartbeatTaskState`), de sorte que les intervalles survivent aux redémarrages normaux.
    - Les horodatages des tâches ne sont avancés qu’après qu’une exécution Heartbeat a terminé son chemin de réponse normal. Les exécutions ignorées `empty-heartbeat-file` / `no-tasks-due` ne marquent pas les tâches comme terminées.

  </Accordion>
</AccordionGroup>

Le mode tâche est utile lorsque vous voulez qu’un seul fichier Heartbeat contienne plusieurs vérifications périodiques sans payer pour toutes à chaque tick.

### L’agent peut-il mettre à jour HEARTBEAT.md ?

Oui — si vous le lui demandez.

`HEARTBEAT.md` est simplement un fichier normal dans l’espace de travail de l’agent, vous pouvez donc dire à l’agent (dans un chat normal) quelque chose comme :

- « Mets à jour `HEARTBEAT.md` pour ajouter une vérification quotidienne du calendrier. »
- « Réécris `HEARTBEAT.md` pour qu’il soit plus court et centré sur les suivis de boîte de réception. »

Si vous voulez que cela se produise de manière proactive, vous pouvez aussi inclure une ligne explicite dans votre prompt Heartbeat comme : « Si la liste de contrôle devient obsolète, mets à jour HEARTBEAT.md avec une meilleure version. »

<Warning>
Ne mettez pas de secrets (clés API, numéros de téléphone, jetons privés) dans `HEARTBEAT.md` — il devient partie du contexte de prompt.
</Warning>

## Réveil manuel (à la demande)

Vous pouvez mettre en file un événement système et déclencher immédiatement un Heartbeat avec :

```bash
openclaw system event --text "Check for urgent follow-ups" --mode now
```

Si plusieurs agents ont `heartbeat` configuré, un réveil manuel exécute immédiatement chacun de ces Heartbeats d’agent.

Utilisez `--mode next-heartbeat` pour attendre le prochain tick planifié.

## Livraison du raisonnement (facultatif)

Par défaut, les Heartbeats livrent uniquement la charge utile finale de « réponse ».

Si vous voulez de la transparence, activez :

- `agents.defaults.heartbeat.includeReasoning: true`

Lorsque cette option est activée, les Heartbeats livrent aussi un message séparé préfixé par `Reasoning:` (même forme que `/reasoning on`). Cela peut être utile lorsque l’agent gère plusieurs sessions/codex et que vous voulez voir pourquoi il a décidé de vous envoyer un ping — mais cela peut aussi révéler plus de détails internes que vous ne le souhaitez. Préférez le laisser désactivé dans les chats de groupe.

## Sensibilité aux coûts

Les Heartbeats exécutent des tours d’agent complets. Des intervalles plus courts consomment plus de tokens. Pour réduire le coût :

- Utilisez `isolatedSession: true` pour éviter d’envoyer l’historique complet de conversation (~100K tokens réduit à ~2-5K par exécution).
- Utilisez `lightContext: true` pour limiter les fichiers d’amorçage au seul `HEARTBEAT.md`.
- Définissez un `model` moins cher (par exemple `ollama/llama3.2:1b`).
- Gardez `HEARTBEAT.md` petit.
- Utilisez `target: "none"` si vous voulez seulement des mises à jour d’état internes.

## Débordement de contexte après Heartbeat

Si un Heartbeat a précédemment laissé une session existante sur un modèle local plus petit, par exemple un modèle Ollama avec une fenêtre de 32k, et que le tour suivant de session principale signale un débordement de contexte, réinitialisez le modèle d’exécution de session vers le modèle principal configuré. Le message de réinitialisation d’OpenClaw le signale lorsque le dernier modèle d’exécution correspond au `heartbeat.model` configuré.

Les Heartbeats actuels préservent le modèle d’exécution existant de la session partagée après la fin de l’exécution. Vous pouvez toujours utiliser `isolatedSession: true` pour exécuter les Heartbeats dans une session fraîche, le combiner avec `lightContext: true` pour obtenir le plus petit prompt, ou choisir un modèle Heartbeat avec une fenêtre de contexte suffisamment grande pour la session partagée.

## Associé

- [Automatisation](/fr/automation) — tous les mécanismes d’automatisation en un coup d’œil
- [Tâches en arrière-plan](/fr/automation/tasks) — comment le travail détaché est suivi
- [Fuseau horaire](/fr/concepts/timezone) — comment le fuseau horaire affecte la planification Heartbeat
- [Dépannage](/fr/automation/cron-jobs#troubleshooting) — débogage des problèmes d’automatisation
