---
read_when:
    - Ajuster la cadence ou les messages du Heartbeat
    - Choisir entre Heartbeat et Cron pour les tâches planifiées
sidebarTitle: Heartbeat
summary: Messages de sondage Heartbeat et règles de notification
title: Heartbeat
x-i18n:
    generated_at: "2026-05-02T20:45:31Z"
    model: gpt-5.5
    provider: openai
    source_hash: 20ce96feb2512312ec8dc5ef3b6722ed552f0a03c55b80a9c3f5b42594ab0d36
    source_path: gateway/heartbeat.md
    workflow: 16
---

<Note>
**Heartbeat ou Cron ?** Consultez [Automatisation et tâches](/fr/automation) pour savoir quand utiliser chacun.
</Note>

Heartbeat exécute des **tours d’agent périodiques** dans la session principale afin que le modèle puisse signaler ce qui nécessite une attention sans vous spammer.

Heartbeat est un tour planifié dans la session principale ; il ne crée **pas** d’enregistrements de [tâche en arrière-plan](/fr/automation/tasks). Les enregistrements de tâches sont destinés au travail détaché (exécutions ACP, sous-agents, tâches Cron isolées).

Dépannage : [Tâches planifiées](/fr/automation/cron-jobs#troubleshooting)

## Démarrage rapide (débutant)

<Steps>
  <Step title="Choisir une cadence">
    Laissez les Heartbeat activés (la valeur par défaut est `30m`, ou `1h` pour l’authentification OAuth/jeton Anthropic, y compris la réutilisation de Claude CLI) ou définissez votre propre cadence.
  </Step>
  <Step title="Ajouter HEARTBEAT.md (facultatif)">
    Créez une petite liste de contrôle `HEARTBEAT.md` ou un bloc `tasks:` dans l’espace de travail de l’agent.
  </Step>
  <Step title="Décider où envoyer les messages Heartbeat">
    `target: "none"` est la valeur par défaut ; définissez `target: "last"` pour router vers le dernier contact.
  </Step>
  <Step title="Réglage facultatif">
    - Activez la livraison du raisonnement Heartbeat pour plus de transparence.
    - Utilisez un contexte d’amorçage léger si les exécutions Heartbeat ont seulement besoin de `HEARTBEAT.md`.
    - Activez les sessions isolées pour éviter d’envoyer tout l’historique de conversation à chaque Heartbeat.
    - Limitez les Heartbeat aux heures actives (heure locale).

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
        skipWhenBusy: true, // optional: also defer when subagent or nested lanes are busy
        // activeHours: { start: "08:00", end: "24:00" },
        // includeReasoning: true, // optional: send separate `Reasoning:` message too
      },
    },
  },
}
```

## Valeurs par défaut

- Intervalle : `30m` (ou `1h` lorsque l’authentification OAuth/jeton Anthropic est le mode d’authentification détecté, y compris la réutilisation de Claude CLI). Définissez `agents.defaults.heartbeat.every` ou `agents.list[].heartbeat.every` par agent ; utilisez `0m` pour désactiver.
- Corps de l’invite (configurable via `agents.defaults.heartbeat.prompt`) : `Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.`
- L’invite Heartbeat est envoyée **telle quelle** comme message utilisateur. L’invite système inclut une section « Heartbeat » uniquement lorsque les Heartbeat sont activés pour l’agent par défaut, et l’exécution est marquée en interne.
- Lorsque les Heartbeat sont désactivés avec `0m`, les exécutions normales omettent aussi `HEARTBEAT.md` du contexte d’amorçage afin que le modèle ne voie pas d’instructions propres aux Heartbeat.
- Les heures actives (`heartbeat.activeHours`) sont vérifiées dans le fuseau horaire configuré. En dehors de la fenêtre, les Heartbeat sont ignorés jusqu’au prochain tic à l’intérieur de la fenêtre.
- Les Heartbeat se reportent automatiquement lorsque du travail Cron est actif ou en file d’attente. Définissez `heartbeat.skipWhenBusy: true` pour reporter aussi sur les voies très occupées (sous-agent ou travail de commande imbriqué) ; c’est utile pour Ollama local et d’autres hôtes à exécution unique contraints.

## À quoi sert l’invite Heartbeat

L’invite par défaut est volontairement large :

- **Tâches en arrière-plan** : « Consider outstanding tasks » incite l’agent à examiner les suivis (boîte de réception, calendrier, rappels, travail en file d’attente) et à signaler ce qui est urgent.
- **Prise de nouvelles humaine** : « Checkup sometimes on your human during day time » incite à envoyer occasionnellement un message léger du type « besoin de quelque chose ? », tout en évitant le spam nocturne grâce à votre fuseau horaire local configuré (voir [Fuseau horaire](/fr/concepts/timezone)).

Heartbeat peut réagir aux [tâches en arrière-plan](/fr/automation/tasks) terminées, mais une exécution Heartbeat ne crée pas elle-même d’enregistrement de tâche.

Si vous voulez qu’un Heartbeat fasse quelque chose de très spécifique (par exemple « vérifier les statistiques Gmail PubSub » ou « vérifier l’état du Gateway »), définissez `agents.defaults.heartbeat.prompt` (ou `agents.list[].heartbeat.prompt`) sur un corps personnalisé (envoyé tel quel).

## Contrat de réponse

- Si rien ne nécessite d’attention, répondez avec **`HEARTBEAT_OK`**.
- Les exécutions Heartbeat capables d’utiliser des outils peuvent à la place appeler `heartbeat_respond` avec `notify: false` pour aucune mise à jour visible, ou `notify: true` avec `notificationText` pour une alerte. Lorsqu’elle est présente, la réponse structurée de l’outil prévaut sur le repli textuel.
- Pendant les exécutions Heartbeat, OpenClaw traite `HEARTBEAT_OK` comme un accusé de réception lorsqu’il apparaît au **début ou à la fin** de la réponse. Le jeton est retiré et la réponse est abandonnée si le contenu restant est **≤ `ackMaxChars`** (par défaut : 300).
- Si `HEARTBEAT_OK` apparaît au **milieu** d’une réponse, il n’est pas traité spécialement.
- Pour les alertes, **n’incluez pas** `HEARTBEAT_OK` ; retournez uniquement le texte de l’alerte.

En dehors des Heartbeat, un `HEARTBEAT_OK` parasite au début/à la fin d’un message est retiré et journalisé ; un message qui contient uniquement `HEARTBEAT_OK` est abandonné.

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
        skipWhenBusy: false, // default: false; true also waits for subagent/nested lanes
        target: "last", // default: none | options: last | none | <channel id> (core or plugin, e.g. "bluebubbles")
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
- `agents.list[].heartbeat` fusionne par-dessus ; si un agent comporte un bloc `heartbeat`, **seuls ces agents** exécutent des Heartbeat.
- `channels.defaults.heartbeat` définit les valeurs de visibilité par défaut pour tous les canaux.
- `channels.<channel>.heartbeat` remplace les valeurs par défaut des canaux.
- `channels.<channel>.accounts.<id>.heartbeat` (canaux multi-comptes) remplace les paramètres par canal.

### Heartbeat par agent

Si une entrée `agents.list[]` inclut un bloc `heartbeat`, **seuls ces agents** exécutent des Heartbeat. Le bloc par agent fusionne par-dessus `agents.defaults.heartbeat` (vous pouvez donc définir les valeurs par défaut partagées une fois et les remplacer par agent).

Exemple : deux agents, seul le second agent exécute des Heartbeat.

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

Limitez les Heartbeat aux heures ouvrées dans un fuseau horaire spécifique :

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

En dehors de cette fenêtre (avant 9 h ou après 22 h heure de l’Est), les Heartbeat sont ignorés. Le prochain tic planifié à l’intérieur de la fenêtre s’exécutera normalement.

### Configuration 24 h/24 et 7 j/7

Si vous voulez que les Heartbeat s’exécutent toute la journée, utilisez l’un de ces modèles :

- Omettez entièrement `activeHours` (aucune restriction de fenêtre horaire ; c’est le comportement par défaut).
- Définissez une fenêtre sur toute la journée : `activeHours: { start: "00:00", end: "24:00" }`.

<Warning>
Ne définissez pas les mêmes heures `start` et `end` (par exemple de `08:00` à `08:00`). Cela est traité comme une fenêtre de largeur nulle, donc les Heartbeat sont toujours ignorés.
</Warning>

### Exemple multi-comptes

Utilisez `accountId` pour cibler un compte spécifique sur des canaux multi-comptes comme Telegram :

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
  Intervalle Heartbeat (chaîne de durée ; unité par défaut = minutes).
</ParamField>
<ParamField path="model" type="string">
  Remplacement facultatif du modèle pour les exécutions Heartbeat (`provider/model`).
</ParamField>
<ParamField path="includeReasoning" type="boolean" default="false">
  Lorsque cette option est activée, livre aussi le message séparé `Reasoning:` lorsqu’il est disponible (même forme que `/reasoning on`).
</ParamField>
<ParamField path="lightContext" type="boolean" default="false">
  Lorsque cette option vaut true, les exécutions Heartbeat utilisent un contexte d’amorçage léger et ne conservent que `HEARTBEAT.md` parmi les fichiers d’amorçage de l’espace de travail.
</ParamField>
<ParamField path="isolatedSession" type="boolean" default="false">
  Lorsque cette option vaut true, chaque Heartbeat s’exécute dans une nouvelle session sans historique de conversation préalable. Utilise le même modèle d’isolation que Cron `sessionTarget: "isolated"`. Réduit fortement le coût en jetons par Heartbeat. Combinez avec `lightContext: true` pour des économies maximales. Le routage de livraison utilise toujours le contexte de la session principale.
</ParamField>
<ParamField path="skipWhenBusy" type="boolean" default="false">
  Lorsque cette option vaut true, les exécutions Heartbeat se reportent sur les voies très occupées : sous-agent ou travail de commande imbriqué. Les voies Cron reportent toujours les Heartbeat, même sans cet indicateur, afin que les hôtes de modèles locaux n’exécutent pas les invites Cron et Heartbeat en même temps.
</ParamField>
<ParamField path="session" type="string">
  Clé de session facultative pour les exécutions Heartbeat.

- `main` (par défaut) : session principale de l’agent.
- Clé de session explicite (copiez depuis `openclaw sessions --json` ou la [CLI des sessions](/fr/cli/sessions)).
- Formats de clés de session : voir [Sessions](/fr/concepts/session) et [Groupes](/fr/channels/groups).

</ParamField>
<ParamField path="target" type="string">
- `last` : livrer au dernier canal externe utilisé.
- canal explicite : n’importe quel canal configuré ou identifiant de Plugin, par exemple `discord`, `matrix`, `telegram` ou `whatsapp`.
- `none` (par défaut) : exécuter le Heartbeat mais **ne pas livrer** à l’extérieur.

</ParamField>
<ParamField path="directPolicy" type='"allow" | "block"' default="allow">
  Contrôle le comportement de livraison directe/DM. `allow` : autoriser la livraison Heartbeat directe/DM. `block` : supprimer la livraison directe/DM (`reason=dm-blocked`).

</ParamField>
<ParamField path="to" type="string">
  Remplacement facultatif du destinataire (identifiant propre au canal, par exemple E.164 pour WhatsApp ou un identifiant de discussion Telegram). Pour les sujets/fils Telegram, utilisez `<chatId>:topic:<messageThreadId>`.

</ParamField>
<ParamField path="accountId" type="string">
  Identifiant de compte facultatif pour les canaux multi-comptes. Lorsque `target: "last"`, l’identifiant de compte s’applique au dernier canal résolu s’il prend en charge les comptes ; sinon, il est ignoré. Si l’identifiant de compte ne correspond pas à un compte configuré pour le canal résolu, la livraison est ignorée.

</ParamField>
<ParamField path="prompt" type="string">
  Remplace le corps d’invite par défaut (pas de fusion).

</ParamField>
<ParamField path="ackMaxChars" type="number" default="300">
  Nombre maximal de caractères autorisés après `HEARTBEAT_OK` avant la livraison.

</ParamField>
<ParamField path="suppressToolErrorWarnings" type="boolean">
  Quand la valeur est true, supprime les charges utiles d'avertissement d'erreur d'outil pendant les exécutions Heartbeat.

</ParamField>
<ParamField path="activeHours" type="object">
  Limite les exécutions Heartbeat à une fenêtre horaire. Objet avec `start` (HH:MM, inclusif; utilisez `00:00` pour le début de journée), `end` (HH:MM exclusif; `24:00` autorisé pour la fin de journée), et `timezone` facultatif.

- Omis ou `"user"` : utilise votre `agents.defaults.userTimezone` s'il est défini, sinon revient au fuseau horaire du système hôte.
- `"local"` : utilise toujours le fuseau horaire du système hôte.
- Tout identifiant IANA (par exemple `America/New_York`) : utilisé directement; s'il est invalide, revient au comportement `"user"` ci-dessus.
- `start` et `end` ne doivent pas être égaux pour une fenêtre active; des valeurs égales sont traitées comme une largeur nulle (toujours en dehors de la fenêtre).
- En dehors de la fenêtre active, les Heartbeats sont ignorés jusqu'au prochain tick dans la fenêtre.

</ParamField>

## Comportement de livraison

<AccordionGroup>
  <Accordion title="Session and target routing">
    - Les Heartbeats s'exécutent par défaut dans la session principale de l'agent (`agent:<id>:<mainKey>`), ou `global` lorsque `session.scope = "global"`. Définissez `session` pour remplacer par une session de canal spécifique (Discord/WhatsApp/etc.).
    - `session` affecte uniquement le contexte d'exécution; la livraison est contrôlée par `target` et `to`.
    - Pour livrer à un canal/destinataire spécifique, définissez `target` + `to`. Avec `target: "last"`, la livraison utilise le dernier canal externe pour cette session.
    - Les livraisons Heartbeat autorisent les cibles directes/DM par défaut. Définissez `directPolicy: "block"` pour supprimer les envois vers des cibles directes tout en continuant à exécuter le tour Heartbeat.
    - Si la file principale, la voie de session cible, la voie Cron ou une tâche Cron active est occupée, le Heartbeat est ignoré et réessayé plus tard.
    - Si `skipWhenBusy: true`, les sous-agents et les voies imbriquées reportent également les exécutions Heartbeat.
    - Si `target` ne résout vers aucune destination externe, l'exécution a tout de même lieu, mais aucun message sortant n'est envoyé.

  </Accordion>
  <Accordion title="Visibility and skip behavior">
    - Si `showOk`, `showAlerts` et `useIndicator` sont tous désactivés, l'exécution est ignorée dès le départ avec `reason=alerts-disabled`.
    - Si seule la livraison des alertes est désactivée, OpenClaw peut toujours exécuter le Heartbeat, mettre à jour les horodatages des tâches dues, restaurer l'horodatage d'inactivité de la session et supprimer la charge utile d'alerte sortante.
    - Si la cible Heartbeat résolue prend en charge l'indication de saisie, OpenClaw affiche la saisie pendant que l'exécution Heartbeat est active. Cela utilise la même cible à laquelle le Heartbeat enverrait la sortie de chat, et c'est désactivé par `typingMode: "never"`.

  </Accordion>
  <Accordion title="Session lifecycle and audit">
    - Les réponses uniquement Heartbeat ne maintiennent **pas** la session active. Les métadonnées Heartbeat peuvent mettre à jour la ligne de session, mais l'expiration pour inactivité utilise `lastInteractionAt` du dernier vrai message utilisateur/canal, et l'expiration quotidienne utilise `sessionStartedAt`.
    - L'historique de l'interface de contrôle et de WebChat masque les prompts Heartbeat et les accusés de réception uniquement OK. La transcription de session sous-jacente peut toujours contenir ces tours pour l'audit/la relecture.
    - Les [tâches d'arrière-plan](/fr/automation/tasks) détachées peuvent mettre en file d'attente un événement système et réveiller Heartbeat lorsque la session principale doit remarquer rapidement quelque chose. Ce réveil ne transforme pas l'exécution Heartbeat en tâche d'arrière-plan.

  </Accordion>
</AccordionGroup>

## Contrôles de visibilité

Par défaut, les accusés de réception `HEARTBEAT_OK` sont supprimés tandis que le contenu d'alerte est livré. Vous pouvez ajuster cela par canal ou par compte :

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

Priorité : par compte → par canal → valeurs par défaut du canal → valeurs par défaut intégrées.

### Ce que fait chaque option

- `showOk` : envoie un accusé de réception `HEARTBEAT_OK` lorsque le modèle renvoie une réponse uniquement OK.
- `showAlerts` : envoie le contenu d'alerte lorsque le modèle renvoie une réponse non OK.
- `useIndicator` : émet des événements d'indicateur pour les surfaces d'état de l'interface utilisateur.

Si **les trois** sont false, OpenClaw ignore entièrement l'exécution Heartbeat (aucun appel au modèle).

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
      showOk: true # all Slack accounts
    accounts:
      ops:
        heartbeat:
          showAlerts: false # suppress alerts for the ops account only
  telegram:
    heartbeat:
      showOk: true
```

### Modèles courants

| Objectif                                 | Configuration                                                                            |
| ---------------------------------------- | ---------------------------------------------------------------------------------------- |
| Comportement par défaut (OK silencieux, alertes activées) | _(aucune configuration nécessaire)_                                                      |
| Entièrement silencieux (aucun message, aucun indicateur) | `channels.defaults.heartbeat: { showOk: false, showAlerts: false, useIndicator: false }` |
| Indicateur uniquement (aucun message)    | `channels.defaults.heartbeat: { showOk: false, showAlerts: false, useIndicator: true }`  |
| OK dans un seul canal uniquement         | `channels.telegram.heartbeat: { showOk: true }`                                          |

## HEARTBEAT.md (facultatif)

Si un fichier `HEARTBEAT.md` existe dans l'espace de travail, le prompt par défaut indique à l'agent de le lire. Considérez-le comme votre « liste de contrôle Heartbeat » : courte, stable et sûre à inclure toutes les 30 minutes.

Lors des exécutions normales, `HEARTBEAT.md` n'est injecté que lorsque les consignes Heartbeat sont activées pour l'agent par défaut. Désactiver la cadence Heartbeat avec `0m` ou définir `includeSystemPromptSection: false` l'omet du contexte de bootstrap normal.

Si `HEARTBEAT.md` existe mais est effectivement vide (uniquement des lignes vides et des en-têtes Markdown comme `# Heading`), OpenClaw ignore l'exécution Heartbeat pour économiser des appels API. Cet abandon est signalé comme `reason=empty-heartbeat-file`. Si le fichier est absent, le Heartbeat s'exécute tout de même et le modèle décide quoi faire.

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
  <Accordion title="Behavior">
    - OpenClaw analyse le bloc `tasks:` et vérifie chaque tâche selon son propre `interval`.
    - Seules les tâches **dues** sont incluses dans le prompt Heartbeat pour ce déclenchement.
    - Si aucune tâche n’est due, le Heartbeat est entièrement ignoré (`reason=no-tasks-due`) afin d’éviter un appel de modèle inutile.
    - Le contenu qui n’est pas lié aux tâches dans `HEARTBEAT.md` est conservé et ajouté comme contexte supplémentaire après la liste des tâches dues.
    - Les horodatages de dernière exécution des tâches sont stockés dans l’état de session (`heartbeatTaskState`), afin que les intervalles survivent aux redémarrages normaux.
    - Les horodatages des tâches ne sont avancés qu’après qu’une exécution Heartbeat a terminé son chemin de réponse normal. Les exécutions ignorées `empty-heartbeat-file` / `no-tasks-due` ne marquent pas les tâches comme terminées.

  </Accordion>
</AccordionGroup>

Le mode tâche est utile lorsque vous voulez qu’un seul fichier Heartbeat contienne plusieurs vérifications périodiques sans les payer toutes à chaque déclenchement.

### L’agent peut-il mettre à jour HEARTBEAT.md ?

Oui — si vous le lui demandez.

`HEARTBEAT.md` est simplement un fichier normal dans l’espace de travail de l’agent ; vous pouvez donc dire à l’agent (dans une conversation normale) quelque chose comme :

- "Mets à jour `HEARTBEAT.md` pour ajouter une vérification quotidienne du calendrier."
- "Réécris `HEARTBEAT.md` pour qu’il soit plus court et axé sur les suivis de boîte de réception."

Si vous voulez que cela se produise de façon proactive, vous pouvez aussi inclure une ligne explicite dans votre prompt Heartbeat comme : "Si la checklist devient obsolète, mets à jour HEARTBEAT.md avec une meilleure version."

<Warning>
Ne mettez pas de secrets (clés API, numéros de téléphone, jetons privés) dans `HEARTBEAT.md` — il devient partie intégrante du contexte du prompt.
</Warning>

## Réveil manuel (à la demande)

Vous pouvez mettre en file d’attente un événement système et déclencher un Heartbeat immédiat avec :

```bash
openclaw system event --text "Check for urgent follow-ups" --mode now
```

Si plusieurs agents ont `heartbeat` configuré, un réveil manuel exécute immédiatement chacun de ces Heartbeats d’agent.

Utilisez `--mode next-heartbeat` pour attendre le prochain déclenchement planifié.

## Livraison du raisonnement (facultatif)

Par défaut, les Heartbeats ne livrent que la charge utile finale de "réponse".

Si vous voulez plus de transparence, activez :

- `agents.defaults.heartbeat.includeReasoning: true`

Une fois activés, les Heartbeats livrent aussi un message séparé préfixé par `Reasoning:` (même forme que `/reasoning on`). Cela peut être utile lorsque l’agent gère plusieurs sessions/codexes et que vous voulez voir pourquoi il a décidé de vous envoyer une notification — mais cela peut aussi divulguer plus de détails internes que souhaité. Préférez le laisser désactivé dans les discussions de groupe.

## Maîtrise des coûts

Les Heartbeats exécutent des tours d’agent complets. Des intervalles plus courts consomment plus de jetons. Pour réduire les coûts :

- Utilisez `isolatedSession: true` pour éviter d’envoyer tout l’historique de conversation (environ 100 K jetons ramenés à environ 2 à 5 K par exécution).
- Utilisez `lightContext: true` pour limiter les fichiers d’amorçage à `HEARTBEAT.md` seulement.
- Définissez un `model` moins coûteux (par ex. `ollama/llama3.2:1b`).
- Gardez `HEARTBEAT.md` petit.
- Utilisez `target: "none"` si vous voulez uniquement des mises à jour d’état internes.

## Débordement de contexte après Heartbeat

Si un Heartbeat a précédemment laissé une session existante sur un modèle local plus petit, par exemple un modèle Ollama avec une fenêtre de 32 k, et que le tour suivant de la session principale signale un débordement de contexte, réinitialisez le modèle d’exécution de la session sur le modèle principal configuré. Le message de réinitialisation d’OpenClaw le signale lorsque le dernier modèle d’exécution correspond au `heartbeat.model` configuré.

Les Heartbeats actuels préservent le modèle d’exécution existant de la session partagée une fois l’exécution terminée. Vous pouvez toujours utiliser `isolatedSession: true` pour exécuter les Heartbeats dans une session fraîche, le combiner avec `lightContext: true` pour le prompt le plus petit, ou choisir un modèle Heartbeat avec une fenêtre de contexte suffisamment grande pour la session partagée.

## Connexe

- [Automation et tâches](/fr/automation) — tous les mécanismes d’automatisation en un coup d’œil
- [Tâches en arrière-plan](/fr/automation/tasks) — comment le travail détaché est suivi
- [Fuseau horaire](/fr/concepts/timezone) — comment le fuseau horaire affecte la planification Heartbeat
- [Dépannage](/fr/automation/cron-jobs#troubleshooting) — débogage des problèmes d’automatisation
