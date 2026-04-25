---
read_when:
    - Ajuster la cadence ou la messagerie de Heartbeat
    - Choisir entre Heartbeat et Cron pour les tâches planifiées
summary: Messages de polling Heartbeat et règles de notification
title: Heartbeat
x-i18n:
    generated_at: "2026-04-25T13:47:19Z"
    model: gpt-5.4
    provider: openai
    source_hash: 17353a03bbae7ad564548e767099f8596764e2cf9bc3d457ec9fc3482ba7d71c
    source_path: gateway/heartbeat.md
    workflow: 15
---

> **Heartbeat ou Cron ?** Voir [Automation & Tasks](/fr/automation) pour savoir quand utiliser chacun.

Heartbeat exécute des **tours d’agent périodiques** dans la session principale afin que le modèle puisse
faire remonter tout ce qui nécessite de l’attention sans vous spammer.

Heartbeat est un tour planifié de la session principale — il ne crée **pas** d’enregistrements de [tâche en arrière-plan](/fr/automation/tasks).
Les enregistrements de tâche sont réservés au travail détaché (exécutions ACP, sous-agents, tâches cron isolées).

Dépannage : [Tâches planifiées](/fr/automation/cron-jobs#troubleshooting)

## Démarrage rapide (débutant)

1. Laissez les heartbeats activés (la valeur par défaut est `30m`, ou `1h` pour l’authentification Anthropic OAuth/jeton, y compris la réutilisation de Claude CLI) ou définissez votre propre cadence.
2. Créez une petite checklist `HEARTBEAT.md` ou un bloc `tasks:` dans l’espace de travail de l’agent (facultatif mais recommandé).
3. Décidez où les messages Heartbeat doivent être envoyés (`target: "none"` est la valeur par défaut ; définissez `target: "last"` pour router vers le dernier contact).
4. Facultatif : activez la livraison du raisonnement Heartbeat pour plus de transparence.
5. Facultatif : utilisez un contexte bootstrap léger si les exécutions Heartbeat n’ont besoin que de `HEARTBEAT.md`.
6. Facultatif : activez les sessions isolées pour éviter d’envoyer l’historique complet de la conversation à chaque Heartbeat.
7. Facultatif : limitez les Heartbeats aux heures actives (heure locale).

Exemple de configuration :

```json5
{
  agents: {
    defaults: {
      heartbeat: {
        every: "30m",
        target: "last", // livraison explicite au dernier contact (la valeur par défaut est "none")
        directPolicy: "allow", // par défaut : allow les cibles directes/DM ; définir "block" pour les supprimer
        lightContext: true, // facultatif : injecter uniquement HEARTBEAT.md depuis les fichiers bootstrap
        isolatedSession: true, // facultatif : session fraîche à chaque exécution (sans historique de conversation)
        // activeHours: { start: "08:00", end: "24:00" },
        // includeReasoning: true, // facultatif : envoyer aussi un message `Reasoning:` séparé
      },
    },
  },
}
```

## Valeurs par défaut

- Intervalle : `30m` (ou `1h` lorsque le mode d’authentification détecté est Anthropic OAuth/jeton, y compris la réutilisation de Claude CLI). Définissez `agents.defaults.heartbeat.every` ou `agents.list[].heartbeat.every` par agent ; utilisez `0m` pour désactiver.
- Corps du prompt (configurable via `agents.defaults.heartbeat.prompt`) :
  `Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.`
- Le prompt Heartbeat est envoyé **mot pour mot** comme message utilisateur. Le prompt
  système inclut une section « Heartbeat » uniquement lorsque les heartbeats sont activés pour l’agent
  par défaut, et que l’exécution est marquée en interne.
- Lorsque les heartbeats sont désactivés avec `0m`, les exécutions normales omettent aussi `HEARTBEAT.md`
  du contexte bootstrap afin que le modèle ne voie pas les instructions réservées aux heartbeats.
- Les heures actives (`heartbeat.activeHours`) sont vérifiées dans le fuseau horaire configuré.
  En dehors de cette fenêtre, les heartbeats sont ignorés jusqu’au prochain tick dans la fenêtre.

## À quoi sert le prompt Heartbeat

Le prompt par défaut est volontairement large :

- **Tâches en arrière-plan** : « Consider outstanding tasks » pousse l’agent à examiner
  les suivis en attente (boîte de réception, calendrier, rappels, travail en file) et à faire remonter tout ce qui est urgent.
- **Prise de nouvelles humaine** : « Checkup sometimes on your human during day time » pousse à un
  message léger occasionnel du type « as-tu besoin de quelque chose ? », tout en évitant le spam nocturne
  grâce à votre fuseau horaire local configuré (voir [/concepts/timezone](/fr/concepts/timezone)).

Heartbeat peut réagir aux [tâches en arrière-plan](/fr/automation/tasks) terminées, mais une exécution Heartbeat ne crée pas elle-même d’enregistrement de tâche.

Si vous voulez qu’un Heartbeat fasse quelque chose de très spécifique (par ex. « check Gmail PubSub
stats » ou « verify gateway health »), définissez `agents.defaults.heartbeat.prompt` (ou
`agents.list[].heartbeat.prompt`) sur un corps personnalisé (envoyé mot pour mot).

## Contrat de réponse

- Si rien ne nécessite d’attention, répondez par **`HEARTBEAT_OK`**.
- Pendant les exécutions Heartbeat, OpenClaw traite `HEARTBEAT_OK` comme un accusé de réception lorsqu’il apparaît
  au **début ou à la fin** de la réponse. Le jeton est supprimé et la réponse est
  abandonnée si le contenu restant est **≤ `ackMaxChars`** (300 par défaut).
- Si `HEARTBEAT_OK` apparaît au **milieu** d’une réponse, il n’est pas traité
  spécialement.
- Pour les alertes, **n’incluez pas** `HEARTBEAT_OK` ; renvoyez uniquement le texte de l’alerte.

En dehors des heartbeats, un `HEARTBEAT_OK` isolé au début/à la fin d’un message est supprimé
et journalisé ; un message qui n’est que `HEARTBEAT_OK` est abandonné.

## Configuration

```json5
{
  agents: {
    defaults: {
      heartbeat: {
        every: "30m", // par défaut : 30m (0m désactive)
        model: "anthropic/claude-opus-4-6",
        includeReasoning: false, // par défaut : false (livrer un message Reasoning: séparé lorsqu’il est disponible)
        lightContext: false, // par défaut : false ; true conserve seulement HEARTBEAT.md parmi les fichiers bootstrap de l’espace de travail
        isolatedSession: false, // par défaut : false ; true exécute chaque heartbeat dans une session fraîche (sans historique de conversation)
        target: "last", // par défaut : none | options : last | none | <channel id> (core ou Plugin, ex. "bluebubbles")
        to: "+15551234567", // remplacement facultatif spécifique au canal
        accountId: "ops-bot", // identifiant de canal multi-compte facultatif
        prompt: "Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.",
        ackMaxChars: 300, // nombre max de caractères autorisés après HEARTBEAT_OK
      },
    },
  },
}
```

### Portée et priorité

- `agents.defaults.heartbeat` définit le comportement global de Heartbeat.
- `agents.list[].heartbeat` fusionne par-dessus ; si un agent possède un bloc `heartbeat`, **seuls ces agents** exécutent des heartbeats.
- `channels.defaults.heartbeat` définit les valeurs par défaut de visibilité pour tous les canaux.
- `channels.<channel>.heartbeat` remplace les valeurs par défaut du canal.
- `channels.<channel>.accounts.<id>.heartbeat` (canaux multi-comptes) remplace les paramètres par canal.

### Heartbeats par agent

Si une entrée `agents.list[]` inclut un bloc `heartbeat`, **seuls ces agents**
exécutent des heartbeats. Le bloc par agent fusionne par-dessus `agents.defaults.heartbeat`
(vous pouvez donc définir des valeurs partagées une seule fois puis les remplacer par agent).

Exemple : deux agents, seul le second exécute des heartbeats.

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
          prompt: "Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.",
        },
      },
    ],
  },
}
```

### Exemple d’heures actives

Limiter les heartbeats aux heures ouvrées dans un fuseau horaire spécifique :

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
          timezone: "America/New_York", // facultatif ; utilise votre userTimezone s’il est défini, sinon le fuseau de l’hôte
        },
      },
    },
  },
}
```

En dehors de cette fenêtre (avant 9h ou après 22h heure de l’Est), les heartbeats sont ignorés. Le prochain tick planifié dans la fenêtre s’exécutera normalement.

### Configuration 24/7

Si vous voulez que les heartbeats s’exécutent toute la journée, utilisez l’un de ces modèles :

- Omettez complètement `activeHours` (aucune restriction de fenêtre horaire ; c’est le comportement par défaut).
- Définissez une fenêtre sur toute la journée : `activeHours: { start: "00:00", end: "24:00" }`.

Ne définissez pas la même heure pour `start` et `end` (par exemple `08:00` à `08:00`).
C’est traité comme une fenêtre de largeur nulle, donc les heartbeats sont toujours ignorés.

### Exemple multi-compte

Utilisez `accountId` pour cibler un compte spécifique sur les canaux multi-comptes comme Telegram :

```json5
{
  agents: {
    list: [
      {
        id: "ops",
        heartbeat: {
          every: "1h",
          target: "telegram",
          to: "12345678:topic:42", // facultatif : router vers un sujet/fil spécifique
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

- `every` : intervalle Heartbeat (chaîne de durée ; unité par défaut = minutes).
- `model` : remplacement facultatif du modèle pour les exécutions Heartbeat (`provider/model`).
- `includeReasoning` : lorsque activé, livre aussi le message séparé `Reasoning:` lorsqu’il est disponible (même forme que `/reasoning on`).
- `lightContext` : lorsque true, les exécutions Heartbeat utilisent un contexte bootstrap léger et ne conservent que `HEARTBEAT.md` parmi les fichiers bootstrap de l’espace de travail.
- `isolatedSession` : lorsque true, chaque Heartbeat s’exécute dans une session fraîche sans historique de conversation préalable. Utilise le même modèle d’isolation que cron `sessionTarget: "isolated"`. Réduit fortement le coût en jetons par Heartbeat. Combinez avec `lightContext: true` pour des économies maximales. Le routage de livraison utilise toujours le contexte de la session principale.
- `session` : clé de session facultative pour les exécutions Heartbeat.
  - `main` (par défaut) : session principale de l’agent.
  - Clé de session explicite (copiée depuis `openclaw sessions --json` ou la [CLI des sessions](/fr/cli/sessions)).
  - Formats de clé de session : voir [Sessions](/fr/concepts/session) et [Groups](/fr/channels/groups).
- `target` :
  - `last` : livrer au dernier canal externe utilisé.
  - canal explicite : tout canal configuré ou identifiant de Plugin, par exemple `discord`, `matrix`, `telegram` ou `whatsapp`.
  - `none` (par défaut) : exécuter le heartbeat mais **ne pas livrer** vers l’extérieur.
- `directPolicy` : contrôle le comportement de livraison directe/DM :
  - `allow` (par défaut) : autorise la livraison directe/DM de Heartbeat.
  - `block` : supprime la livraison directe/DM (`reason=dm-blocked`).
- `to` : remplacement facultatif du destinataire (identifiant spécifique au canal, par ex. E.164 pour WhatsApp ou un identifiant de chat Telegram). Pour les sujets/fils Telegram, utilisez `<chatId>:topic:<messageThreadId>`.
- `accountId` : identifiant de compte facultatif pour les canaux multi-comptes. Lorsque `target: "last"`, l’identifiant de compte s’applique au dernier canal résolu s’il prend en charge les comptes ; sinon il est ignoré. Si l’identifiant de compte ne correspond pas à un compte configuré pour le canal résolu, la livraison est ignorée.
- `prompt` : remplace le corps du prompt par défaut (pas de fusion).
- `ackMaxChars` : nombre maximal de caractères autorisés après `HEARTBEAT_OK` avant livraison.
- `suppressToolErrorWarnings` : lorsque true, supprime les charges utiles d’avertissement d’erreur d’outil pendant les exécutions Heartbeat.
- `activeHours` : limite les exécutions Heartbeat à une fenêtre horaire. Objet avec `start` (HH:MM, inclusif ; utilisez `00:00` pour le début de journée), `end` (HH:MM exclusif ; `24:00` autorisé pour la fin de journée), et `timezone` facultatif.
  - Omit ou `"user"` : utilise votre `agents.defaults.userTimezone` s’il est défini, sinon revient au fuseau horaire du système hôte.
  - `"local"` : utilise toujours le fuseau horaire du système hôte.
  - Tout identifiant IANA (ex. `America/New_York`) : utilisé directement ; s’il est invalide, revient au comportement `"user"` ci-dessus.
  - `start` et `end` ne doivent pas être égaux pour une fenêtre active ; des valeurs égales sont traitées comme une largeur nulle (toujours hors fenêtre).
  - En dehors de la fenêtre active, les heartbeats sont ignorés jusqu’au prochain tick dans la fenêtre.

## Comportement de livraison

- Les heartbeats s’exécutent par défaut dans la session principale de l’agent (`agent:<id>:<mainKey>`),
  ou `global` lorsque `session.scope = "global"`. Définissez `session` pour remplacer cela par une
  session de canal spécifique (Discord/WhatsApp/etc.).
- `session` n’affecte que le contexte d’exécution ; la livraison est contrôlée par `target` et `to`.
- Pour livrer à un canal/destinataire spécifique, définissez `target` + `to`. Avec
  `target: "last"`, la livraison utilise le dernier canal externe pour cette session.
- Les livraisons Heartbeat autorisent les cibles directes/DM par défaut. Définissez `directPolicy: "block"` pour supprimer les envois vers des cibles directes tout en exécutant quand même le tour Heartbeat.
- Si la file principale est occupée, le heartbeat est ignoré puis réessayé plus tard.
- Si `target` ne se résout vers aucune destination externe, l’exécution a quand même lieu mais aucun
  message sortant n’est envoyé.
- Si `showOk`, `showAlerts` et `useIndicator` sont tous désactivés, l’exécution est ignorée d’emblée avec `reason=alerts-disabled`.
- Si seule la livraison des alertes est désactivée, OpenClaw peut quand même exécuter le heartbeat, mettre à jour les horodatages des tâches dues, restaurer l’horodatage d’inactivité de la session et supprimer la charge utile d’alerte sortante.
- Si la cible Heartbeat résolue prend en charge l’indicateur de saisie, OpenClaw l’affiche pendant
  que l’exécution Heartbeat est active. Cela utilise la même cible que celle vers laquelle le heartbeat
  enverrait la sortie de chat, et cela est désactivé par `typingMode: "never"`.
- Les réponses propres à Heartbeat ne maintiennent **pas** la session en vie ; le dernier `updatedAt`
  est restauré afin que l’expiration par inactivité se comporte normalement.
- L’historique de Control UI et de WebChat masque les prompts Heartbeat et les
  accusés de réception uniquement `OK`. La transcription de session sous-jacente peut quand même contenir ces
  tours à des fins d’audit/relecture.
- Les [tâches en arrière-plan](/fr/automation/tasks) détachées peuvent mettre en file d’attente un événement système et réveiller Heartbeat lorsque la session principale doit remarquer quelque chose rapidement. Ce réveil ne transforme pas l’exécution Heartbeat en tâche en arrière-plan.

## Contrôles de visibilité

Par défaut, les accusés de réception `HEARTBEAT_OK` sont supprimés tandis que le contenu des alertes est
livré. Vous pouvez ajuster cela par canal ou par compte :

```yaml
channels:
  defaults:
    heartbeat:
      showOk: false # Masquer HEARTBEAT_OK (par défaut)
      showAlerts: true # Afficher les messages d’alerte (par défaut)
      useIndicator: true # Émettre des événements d’indicateur (par défaut)
  telegram:
    heartbeat:
      showOk: true # Afficher les accusés de réception OK sur Telegram
  whatsapp:
    accounts:
      work:
        heartbeat:
          showAlerts: false # Supprimer la livraison des alertes pour ce compte
```

Priorité : par compte → par canal → valeurs par défaut du canal → valeurs intégrées par défaut.

### Rôle de chaque indicateur

- `showOk` : envoie un accusé de réception `HEARTBEAT_OK` lorsque le modèle renvoie une réponse uniquement OK.
- `showAlerts` : envoie le contenu de l’alerte lorsque le modèle renvoie une réponse non-OK.
- `useIndicator` : émet des événements d’indicateur pour les surfaces d’état UI.

Si **les trois** sont à false, OpenClaw ignore entièrement l’exécution Heartbeat (aucun appel au modèle).

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
          showAlerts: false # supprime les alertes pour le seul compte ops
  telegram:
    heartbeat:
      showOk: true
```

### Modèles courants

| Objectif                                 | Configuration                                                                            |
| ---------------------------------------- | ---------------------------------------------------------------------------------------- |
| Comportement par défaut (OK silencieux, alertes activées) | _(aucune configuration nécessaire)_                                                     |
| Entièrement silencieux (aucun message, aucun indicateur) | `channels.defaults.heartbeat: { showOk: false, showAlerts: false, useIndicator: false }` |
| Indicateur uniquement (aucun message)    | `channels.defaults.heartbeat: { showOk: false, showAlerts: false, useIndicator: true }` |
| OK sur un seul canal                     | `channels.telegram.heartbeat: { showOk: true }`                                          |

## HEARTBEAT.md (facultatif)

Si un fichier `HEARTBEAT.md` existe dans l’espace de travail, le prompt par défaut indique à l’agent
de le lire. Considérez-le comme votre « checklist heartbeat » : petite, stable et
sans risque à inclure toutes les 30 minutes.

Lors des exécutions normales, `HEARTBEAT.md` n’est injecté que lorsque les instructions Heartbeat sont
activées pour l’agent par défaut. Désactiver la cadence Heartbeat avec `0m` ou
définir `includeSystemPromptSection: false` l’omet du contexte bootstrap
normal.

Si `HEARTBEAT.md` existe mais est effectivement vide (seulement des lignes vides et des en-têtes
Markdown comme `# Heading`), OpenClaw ignore l’exécution Heartbeat pour économiser des appels API.
Cette omission est signalée comme `reason=empty-heartbeat-file`.
Si le fichier est absent, le heartbeat s’exécute quand même et le modèle décide quoi faire.

Gardez-le très petit (checklist courte ou rappels) pour éviter de gonfler le prompt.

Exemple de `HEARTBEAT.md` :

```md
# Checklist heartbeat

- Scan rapide : quelque chose d’urgent dans les boîtes de réception ?
- Si c’est la journée, faire une prise de nouvelles légère si rien d’autre n’est en attente.
- Si une tâche est bloquée, noter _ce qui manque_ et le demander à Peter la prochaine fois.
```

### Blocs `tasks:`

`HEARTBEAT.md` prend également en charge un petit bloc structuré `tasks:` pour des
vérifications basées sur des intervalles à l’intérieur même du heartbeat.

Exemple :

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

Comportement :

- OpenClaw analyse le bloc `tasks:` et vérifie chaque tâche selon son propre `interval`.
- Seules les tâches **dues** sont incluses dans le prompt Heartbeat pour ce tick.
- Si aucune tâche n’est due, le heartbeat est entièrement ignoré (`reason=no-tasks-due`) pour éviter un appel au modèle inutile.
- Le contenu hors tâche de `HEARTBEAT.md` est conservé et ajouté comme contexte supplémentaire après la liste des tâches dues.
- Les horodatages de dernière exécution des tâches sont stockés dans l’état de session (`heartbeatTaskState`), afin que les intervalles survivent aux redémarrages normaux.
- Les horodatages des tâches ne sont avancés qu’après qu’une exécution Heartbeat a terminé son chemin normal de réponse. Les exécutions ignorées `empty-heartbeat-file` / `no-tasks-due` ne marquent pas les tâches comme terminées.

Le mode tâche est utile lorsque vous voulez qu’un seul fichier Heartbeat contienne plusieurs vérifications périodiques sans payer le coût de toutes à chaque tick.

### L’agent peut-il mettre à jour HEARTBEAT.md ?

Oui — si vous le lui demandez.

`HEARTBEAT.md` est simplement un fichier normal dans l’espace de travail de l’agent, vous pouvez donc dire à l’agent
(dans un chat normal) quelque chose comme :

- « Mets à jour `HEARTBEAT.md` pour ajouter une vérification quotidienne du calendrier. »
- « Réécris `HEARTBEAT.md` pour qu’il soit plus court et centré sur le suivi de boîte de réception. »

Si vous voulez que cela se produise de manière proactive, vous pouvez aussi inclure une ligne explicite dans
votre prompt Heartbeat comme : « If the checklist becomes stale, update HEARTBEAT.md
with a better one. »

Remarque de sécurité : ne mettez pas de secrets (clés API, numéros de téléphone, jetons privés) dans
`HEARTBEAT.md` — il fait partie du contexte du prompt.

## Réveil manuel (à la demande)

Vous pouvez mettre un événement système en file d’attente et déclencher un Heartbeat immédiat avec :

```bash
openclaw system event --text "Check for urgent follow-ups" --mode now
```

Si plusieurs agents ont `heartbeat` configuré, un réveil manuel exécute immédiatement chacun de ces
heartbeats d’agent.

Utilisez `--mode next-heartbeat` pour attendre le prochain tick planifié.

## Livraison du raisonnement (facultatif)

Par défaut, les heartbeats ne livrent que la charge utile finale de « réponse ».

Si vous voulez de la transparence, activez :

- `agents.defaults.heartbeat.includeReasoning: true`

Lorsqu’il est activé, les heartbeats livrent aussi un message séparé préfixé par
`Reasoning:` (même forme que `/reasoning on`). Cela peut être utile lorsque l’agent
gère plusieurs sessions/codex et que vous voulez voir pourquoi il a décidé de vous
solliciter — mais cela peut aussi divulguer plus de détails internes que vous ne le souhaitez. Préférez le laisser
désactivé dans les chats de groupe.

## Sensibilité au coût

Les heartbeats exécutent des tours d’agent complets. Des intervalles plus courts consomment plus de jetons. Pour réduire le coût :

- Utilisez `isolatedSession: true` pour éviter d’envoyer l’historique complet de conversation (~100K jetons jusqu’à ~2-5K par exécution).
- Utilisez `lightContext: true` pour limiter les fichiers bootstrap à `HEARTBEAT.md` uniquement.
- Définissez un `model` moins coûteux (par ex. `ollama/llama3.2:1b`).
- Gardez `HEARTBEAT.md` petit.
- Utilisez `target: "none"` si vous voulez uniquement des mises à jour d’état internes.

## Connexe

- [Automation & Tasks](/fr/automation) — vue d’ensemble de tous les mécanismes d’automatisation
- [Background Tasks](/fr/automation/tasks) — comment le travail détaché est suivi
- [Timezone](/fr/concepts/timezone) — comment le fuseau horaire affecte la planification Heartbeat
- [Troubleshooting](/fr/automation/cron-jobs#troubleshooting) — débogage des problèmes d’automatisation
