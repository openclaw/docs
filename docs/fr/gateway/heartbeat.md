---
read_when:
    - Ajuster la cadence ou la messagerie de Heartbeat
    - Choisir entre Heartbeat et Cron pour les tâches planifiées
sidebarTitle: Heartbeat
summary: Messages de sondage Heartbeat et règles de notification
title: Heartbeat
x-i18n:
    generated_at: "2026-04-26T11:28:54Z"
    model: gpt-5.4
    provider: openai
    source_hash: fe0d3e9c531062d90e8e24cb7795fed20bc0985c3eadc8ed367295fc2544d14e
    source_path: gateway/heartbeat.md
    workflow: 15
---

<Note>
**Heartbeat ou cron ?** Voir [Automatisation et tâches](/fr/automation) pour savoir quand utiliser l’un ou l’autre.
</Note>

Heartbeat exécute des **tours d’agent périodiques** dans la session principale afin que le modèle puisse faire remonter tout ce qui nécessite de l’attention sans vous spammer.

Heartbeat est un tour planifié de la session principale — il ne crée **pas** d’enregistrements de [tâche en arrière-plan](/fr/automation/tasks). Les enregistrements de tâches sont destinés au travail détaché (exécutions ACP, sous-agents, tâches cron isolées).

Dépannage : [Tâches planifiées](/fr/automation/cron-jobs#troubleshooting)

## Démarrage rapide (débutant)

<Steps>
  <Step title="Choisir une cadence">
    Laissez les heartbeats activés (la valeur par défaut est `30m`, ou `1h` pour l’authentification Anthropic OAuth/token, y compris la réutilisation de Claude CLI) ou définissez votre propre cadence.
  </Step>
  <Step title="Ajouter HEARTBEAT.md (facultatif)">
    Créez une petite checklist `HEARTBEAT.md` ou un bloc `tasks:` dans l’espace de travail de l’agent.
  </Step>
  <Step title="Décider où doivent aller les messages heartbeat">
    `target: "none"` est la valeur par défaut ; définissez `target: "last"` pour acheminer vers le dernier contact.
  </Step>
  <Step title="Réglage facultatif">
    - Activez la livraison du raisonnement heartbeat pour plus de transparence.
    - Utilisez un contexte de bootstrap léger si les exécutions heartbeat n’ont besoin que de `HEARTBEAT.md`.
    - Activez les sessions isolées pour éviter d’envoyer l’historique complet de la conversation à chaque heartbeat.
    - Limitez les heartbeats aux heures actives (heure locale).
  </Step>
</Steps>

Exemple de config :

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
        // activeHours: { start: "08:00", end: "24:00" },
        // includeReasoning: true, // optional: send separate `Reasoning:` message too
      },
    },
  },
}
```

## Valeurs par défaut

- Intervalle : `30m` (ou `1h` lorsque l’authentification Anthropic OAuth/token est le mode d’authentification détecté, y compris la réutilisation de Claude CLI). Définissez `agents.defaults.heartbeat.every` ou `agents.list[].heartbeat.every` par agent ; utilisez `0m` pour désactiver.
- Corps du prompt (configurable via `agents.defaults.heartbeat.prompt`) : `Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.`
- Le prompt heartbeat est envoyé **mot pour mot** comme message utilisateur. Le prompt système inclut une section « Heartbeat » uniquement lorsque les heartbeats sont activés pour l’agent par défaut, et que l’exécution est marquée en interne.
- Lorsque les heartbeats sont désactivés avec `0m`, les exécutions normales omettent également `HEARTBEAT.md` du contexte de bootstrap afin que le modèle ne voie pas les instructions réservées aux heartbeats.
- Les heures actives (`heartbeat.activeHours`) sont vérifiées dans le fuseau horaire configuré. En dehors de cette fenêtre, les heartbeats sont ignorés jusqu’au tick suivant dans la fenêtre.

## À quoi sert le prompt heartbeat

Le prompt par défaut est volontairement large :

- **Tâches en arrière-plan** : « Consider outstanding tasks » incite l’agent à examiner les suivis (boîte de réception, calendrier, rappels, travail en file d’attente) et à signaler tout ce qui est urgent.
- **Vérification humaine** : « Checkup sometimes on your human during day time » incite à un message léger occasionnel du type « avez-vous besoin de quelque chose ? », tout en évitant le spam nocturne en utilisant votre fuseau horaire local configuré (voir [Fuseau horaire](/fr/concepts/timezone)).

Heartbeat peut réagir à des [tâches en arrière-plan](/fr/automation/tasks) terminées, mais une exécution heartbeat ne crée pas elle-même d’enregistrement de tâche.

Si vous voulez qu’un heartbeat fasse quelque chose de très précis (par ex. « vérifier les statistiques Gmail PubSub » ou « vérifier la santé du gateway »), définissez `agents.defaults.heartbeat.prompt` (ou `agents.list[].heartbeat.prompt`) sur un corps personnalisé (envoyé mot pour mot).

## Contrat de réponse

- Si rien ne nécessite d’attention, répondez par **`HEARTBEAT_OK`**.
- Pendant les exécutions heartbeat, OpenClaw traite `HEARTBEAT_OK` comme un accusé de réception lorsqu’il apparaît au **début ou à la fin** de la réponse. Le token est supprimé et la réponse est ignorée si le contenu restant est **≤ `ackMaxChars`** (par défaut : 300).
- Si `HEARTBEAT_OK` apparaît au **milieu** d’une réponse, il n’est pas traité de manière spéciale.
- Pour les alertes, **n’incluez pas** `HEARTBEAT_OK` ; renvoyez uniquement le texte d’alerte.

En dehors des heartbeats, un `HEARTBEAT_OK` isolé au début/à la fin d’un message est supprimé et journalisé ; un message qui n’est que `HEARTBEAT_OK` est ignoré.

## Config

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

### Portée et priorité

- `agents.defaults.heartbeat` définit le comportement global de heartbeat.
- `agents.list[].heartbeat` se fusionne par-dessus ; si un agent possède un bloc `heartbeat`, **seuls ces agents** exécutent des heartbeats.
- `channels.defaults.heartbeat` définit les valeurs par défaut de visibilité pour tous les canaux.
- `channels.<channel>.heartbeat` remplace les valeurs par défaut du canal.
- `channels.<channel>.accounts.<id>.heartbeat` (canaux multi-comptes) remplace les paramètres par canal.

### Heartbeats par agent

Si une entrée `agents.list[]` inclut un bloc `heartbeat`, **seuls ces agents** exécutent des heartbeats. Le bloc par agent se fusionne par-dessus `agents.defaults.heartbeat` (vous pouvez ainsi définir des valeurs partagées une seule fois et les remplacer par agent).

Exemple : deux agents, seul le deuxième exécute des heartbeats.

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

Limitez les heartbeats aux heures ouvrées dans un fuseau horaire spécifique :

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

En dehors de cette fenêtre (avant 9 h ou après 22 h, heure de l’Est), les heartbeats sont ignorés. Le tick planifié suivant dans la fenêtre s’exécutera normalement.

### Configuration 24 h/24, 7 j/7

Si vous voulez que les heartbeats s’exécutent toute la journée, utilisez l’un de ces modèles :

- Omettez complètement `activeHours` (aucune restriction de fenêtre horaire ; c’est le comportement par défaut).
- Définissez une fenêtre sur toute la journée : `activeHours: { start: "00:00", end: "24:00" }`.

<Warning>
Ne définissez pas la même heure pour `start` et `end` (par exemple `08:00` à `08:00`). Cela est traité comme une fenêtre de largeur nulle, donc les heartbeats sont toujours ignorés.
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
  Substitution facultative du modèle pour les exécutions heartbeat (`provider/model`).
</ParamField>
<ParamField path="includeReasoning" type="boolean" default="false">
  Lorsqu’il est activé, livre aussi le message séparé `Reasoning:` lorsqu’il est disponible (même forme que `/reasoning on`).
</ParamField>
<ParamField path="lightContext" type="boolean" default="false">
  Lorsqu’il vaut true, les exécutions heartbeat utilisent un contexte de bootstrap léger et ne conservent que `HEARTBEAT.md` parmi les fichiers de bootstrap de l’espace de travail.
</ParamField>
<ParamField path="isolatedSession" type="boolean" default="false">
  Lorsqu’il vaut true, chaque heartbeat s’exécute dans une session fraîche sans historique de conversation antérieur. Utilise le même modèle d’isolation que cron `sessionTarget: "isolated"`. Réduit fortement le coût en tokens par heartbeat. Combinez avec `lightContext: true` pour des économies maximales. Le routage de livraison utilise toujours le contexte de la session principale.
</ParamField>
<ParamField path="session" type="string">
  Clé de session facultative pour les exécutions heartbeat.

  - `main` (par défaut) : session principale de l’agent.
  - Clé de session explicite (copiez-la depuis `openclaw sessions --json` ou la [CLI sessions](/fr/cli/sessions)).
  - Formats de clé de session : voir [Sessions](/fr/concepts/session) et [Groupes](/fr/channels/groups).
</ParamField>
<ParamField path="target" type="string">
  - `last` : livrer au dernier canal externe utilisé.
  - canal explicite : tout canal configuré ou identifiant de Plugin, par exemple `discord`, `matrix`, `telegram` ou `whatsapp`.
  - `none` (par défaut) : exécuter heartbeat mais **ne pas livrer** en externe.
</ParamField>
<ParamField path="directPolicy" type='"allow" | "block"' default="allow">
  Contrôle le comportement de livraison directe/DM. `allow` : autoriser la livraison heartbeat directe/DM. `block` : supprimer la livraison directe/DM (`reason=dm-blocked`).
</ParamField>
<ParamField path="to" type="string">
  Substitution facultative du destinataire (identifiant spécifique au canal, par ex. E.164 pour WhatsApp ou identifiant de chat Telegram). Pour les sujets/fils Telegram, utilisez `<chatId>:topic:<messageThreadId>`.
</ParamField>
<ParamField path="accountId" type="string">
  Identifiant de compte facultatif pour les canaux multi-comptes. Lorsque `target: "last"`, l’identifiant de compte s’applique au dernier canal résolu s’il prend en charge les comptes ; sinon il est ignoré. Si l’identifiant de compte ne correspond pas à un compte configuré pour le canal résolu, la livraison est ignorée.
</ParamField>
<ParamField path="prompt" type="string">
  Remplace le corps du prompt par défaut (sans fusion).
</ParamField>
<ParamField path="ackMaxChars" type="number" default="300">
  Nombre maximal de caractères autorisés après `HEARTBEAT_OK` avant livraison.
</ParamField>
<ParamField path="suppressToolErrorWarnings" type="boolean">
  Lorsqu’il vaut true, supprime les payloads d’avertissement d’erreur d’outil pendant les exécutions heartbeat.
</ParamField>
<ParamField path="activeHours" type="object">
  Restreint les exécutions heartbeat à une fenêtre horaire. Objet avec `start` (HH:MM, inclusif ; utilisez `00:00` pour le début de journée), `end` (HH:MM exclusif ; `24:00` autorisé pour la fin de journée) et `timezone` facultatif.

  - Omission ou `"user"` : utilise votre `agents.defaults.userTimezone` s’il est défini, sinon revient au fuseau horaire du système hôte.
  - `"local"` : utilise toujours le fuseau horaire du système hôte.
  - Tout identifiant IANA (par ex. `America/New_York`) : utilisé directement ; s’il est invalide, revient au comportement `"user"` ci-dessus.
  - `start` et `end` ne doivent pas être égaux pour une fenêtre active ; des valeurs égales sont traitées comme une fenêtre de largeur nulle (toujours en dehors de la fenêtre).
  - En dehors de la fenêtre active, les heartbeats sont ignorés jusqu’au tick suivant à l’intérieur de la fenêtre.
</ParamField>

## Comportement de livraison

<AccordionGroup>
  <Accordion title="Session et routage de cible">
    - Les heartbeats s’exécutent par défaut dans la session principale de l’agent (`agent:<id>:<mainKey>`), ou `global` lorsque `session.scope = "global"`. Définissez `session` pour remplacer cela par une session de canal spécifique (Discord/WhatsApp/etc.).
    - `session` n’affecte que le contexte d’exécution ; la livraison est contrôlée par `target` et `to`.
    - Pour livrer à un canal/destinataire spécifique, définissez `target` + `to`. Avec `target: "last"`, la livraison utilise le dernier canal externe de cette session.
    - Les livraisons heartbeat autorisent par défaut les cibles directes/DM. Définissez `directPolicy: "block"` pour supprimer les envois vers des cibles directes tout en exécutant quand même le tour heartbeat.
    - Si la file principale est occupée, le heartbeat est ignoré et réessayé plus tard.
    - Si `target` ne se résout vers aucune destination externe, l’exécution a tout de même lieu mais aucun message sortant n’est envoyé.
  </Accordion>
  <Accordion title="Visibilité et comportement d’ignorance">
    - Si `showOk`, `showAlerts` et `useIndicator` sont tous désactivés, l’exécution est ignorée d’emblée avec `reason=alerts-disabled`.
    - Si seule la livraison des alertes est désactivée, OpenClaw peut quand même exécuter le heartbeat, mettre à jour les horodatages des tâches arrivées à échéance, restaurer l’horodatage d’inactivité de la session et supprimer le payload d’alerte sortant.
    - Si la cible heartbeat résolue prend en charge l’indicateur de saisie, OpenClaw affiche la saisie pendant que l’exécution heartbeat est active. Cela utilise la même cible que celle à laquelle le heartbeat enverrait la sortie de discussion, et c’est désactivé par `typingMode: "never"`.
  </Accordion>
  <Accordion title="Cycle de vie de session et audit">
    - Les réponses heartbeat seules ne maintiennent **pas** la session en vie. Les métadonnées heartbeat peuvent mettre à jour la ligne de session, mais l’expiration d’inactivité utilise `lastInteractionAt` du dernier vrai message utilisateur/canal, et l’expiration quotidienne utilise `sessionStartedAt`.
    - L’historique de Control UI et de WebChat masque les prompts heartbeat et les accusés de réception uniquement OK. Le transcript de session sous-jacent peut toujours contenir ces tours pour audit/relecture.
    - Les [tâches en arrière-plan](/fr/automation/tasks) détachées peuvent mettre en file un événement système et réveiller heartbeat lorsque la session principale doit remarquer quelque chose rapidement. Ce réveil ne fait pas de l’exécution heartbeat une tâche en arrière-plan.
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

Priorité : par compte → par canal → valeurs par défaut du canal → valeurs par défaut intégrées.

### Ce que fait chaque drapeau

- `showOk` : envoie un accusé de réception `HEARTBEAT_OK` lorsque le modèle renvoie une réponse uniquement OK.
- `showAlerts` : envoie le contenu de l’alerte lorsque le modèle renvoie une réponse non OK.
- `useIndicator` : émet des événements d’indicateur pour les surfaces d’état de l’interface.

Si **les trois** sont false, OpenClaw ignore entièrement l’exécution heartbeat (aucun appel modèle).

### Exemples par canal vs par compte

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

| Objectif                                  | Config                                                                                   |
| ----------------------------------------- | ---------------------------------------------------------------------------------------- |
| Comportement par défaut (OK silencieux, alertes activées) | _(aucune config nécessaire)_                                                  |
| Totalement silencieux (aucun message, aucun indicateur) | `channels.defaults.heartbeat: { showOk: false, showAlerts: false, useIndicator: false }` |
| Indicateur uniquement (aucun message)     | `channels.defaults.heartbeat: { showOk: false, showAlerts: false, useIndicator: true }`  |
| OK dans un seul canal                     | `channels.telegram.heartbeat: { showOk: true }`                                          |

## HEARTBEAT.md (facultatif)

Si un fichier `HEARTBEAT.md` existe dans l’espace de travail, le prompt par défaut indique à l’agent de le lire. Considérez-le comme votre « checklist heartbeat » : petite, stable et sûre à inclure toutes les 30 minutes.

Lors des exécutions normales, `HEARTBEAT.md` n’est injecté que lorsque les indications heartbeat sont activées pour l’agent par défaut. Désactiver la cadence heartbeat avec `0m` ou définir `includeSystemPromptSection: false` l’omet du contexte de bootstrap normal.

Si `HEARTBEAT.md` existe mais est effectivement vide (seulement des lignes vides et des en-têtes Markdown comme `# Titre`), OpenClaw ignore l’exécution heartbeat pour économiser des appels API. Cette ignorance est signalée comme `reason=empty-heartbeat-file`. Si le fichier est absent, le heartbeat s’exécute quand même et le modèle décide quoi faire.

Gardez-le petit (checklist courte ou rappels) pour éviter de gonfler le prompt.

Exemple de `HEARTBEAT.md` :

```md
# Checklist heartbeat

- Analyse rapide : y a-t-il quelque chose d’urgent dans les boîtes de réception ?
- Si c’est la journée, faire une vérification légère si rien d’autre n’est en attente.
- Si une tâche est bloquée, noter _ce qui manque_ et demander à Peter la prochaine fois.
```

### Blocs `tasks:`

`HEARTBEAT.md` prend aussi en charge un petit bloc structuré `tasks:` pour des vérifications basées sur des intervalles dans heartbeat lui-même.

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
    - OpenClaw analyse le bloc `tasks:` et vérifie chaque tâche par rapport à son propre `interval`.
    - Seules les tâches **arrivées à échéance** sont incluses dans le prompt heartbeat pour ce tick.
    - Si aucune tâche n’est arrivée à échéance, le heartbeat est entièrement ignoré (`reason=no-tasks-due`) pour éviter un appel modèle inutile.
    - Le contenu hors tâches dans `HEARTBEAT.md` est conservé et ajouté comme contexte supplémentaire après la liste des tâches arrivées à échéance.
    - Les horodatages de dernière exécution des tâches sont stockés dans l’état de session (`heartbeatTaskState`), de sorte que les intervalles survivent aux redémarrages normaux.
    - Les horodatages de tâche ne sont avancés qu’une fois qu’une exécution heartbeat termine son chemin normal de réponse. Les exécutions ignorées `empty-heartbeat-file` / `no-tasks-due` ne marquent pas les tâches comme terminées.
  </Accordion>
</AccordionGroup>

Le mode tâche est utile lorsque vous voulez qu’un seul fichier heartbeat contienne plusieurs vérifications périodiques sans payer pour toutes à chaque tick.

### L’agent peut-il mettre à jour HEARTBEAT.md ?

Oui — si vous le lui demandez.

`HEARTBEAT.md` n’est qu’un fichier normal dans l’espace de travail de l’agent, vous pouvez donc dire à l’agent (dans une discussion normale) quelque chose comme :

- « Mets à jour `HEARTBEAT.md` pour ajouter une vérification quotidienne du calendrier. »
- « Réécris `HEARTBEAT.md` pour qu’il soit plus court et axé sur les suivis de boîte de réception. »

Si vous voulez que cela se fasse de manière proactive, vous pouvez aussi inclure une ligne explicite dans votre prompt heartbeat comme : « Si la checklist devient obsolète, mets à jour HEARTBEAT.md avec une meilleure version. »

<Warning>
Ne mettez pas de secrets (clés API, numéros de téléphone, tokens privés) dans `HEARTBEAT.md` — il fait partie du contexte du prompt.
</Warning>

## Réveil manuel (à la demande)

Vous pouvez mettre en file un événement système et déclencher un heartbeat immédiat avec :

```bash
openclaw system event --text "Check for urgent follow-ups" --mode now
```

Si plusieurs agents ont `heartbeat` configuré, un réveil manuel exécute immédiatement chacun de ces heartbeats d’agent.

Utilisez `--mode next-heartbeat` pour attendre le prochain tick planifié.

## Livraison du raisonnement (facultatif)

Par défaut, les heartbeats ne livrent que le payload final de « réponse ».

Si vous voulez de la transparence, activez :

- `agents.defaults.heartbeat.includeReasoning: true`

Lorsqu’elle est activée, les heartbeats livrent aussi un message séparé préfixé par `Reasoning:` (même forme que `/reasoning on`). Cela peut être utile lorsque l’agent gère plusieurs sessions/codex et que vous voulez voir pourquoi il a décidé de vous alerter — mais cela peut aussi divulguer davantage de détails internes que vous ne le souhaitez. Il vaut mieux laisser cette option désactivée dans les discussions de groupe.

## Sensibilité au coût

Les heartbeats exécutent des tours d’agent complets. Des intervalles plus courts consomment plus de tokens. Pour réduire le coût :

- Utilisez `isolatedSession: true` pour éviter d’envoyer l’historique complet de la conversation (~100K tokens réduits à ~2-5K par exécution).
- Utilisez `lightContext: true` pour limiter les fichiers de bootstrap à `HEARTBEAT.md` uniquement.
- Définissez un `model` moins cher (par ex. `ollama/llama3.2:1b`).
- Gardez `HEARTBEAT.md` petit.
- Utilisez `target: "none"` si vous ne voulez que des mises à jour d’état internes.

## Lié

- [Automatisation et tâches](/fr/automation) — tous les mécanismes d’automatisation en un coup d’œil
- [Tâches en arrière-plan](/fr/automation/tasks) — comment le travail détaché est suivi
- [Fuseau horaire](/fr/concepts/timezone) — comment le fuseau horaire affecte la planification heartbeat
- [Dépannage](/fr/automation/cron-jobs#troubleshooting) — déboguer les problèmes d’automatisation
