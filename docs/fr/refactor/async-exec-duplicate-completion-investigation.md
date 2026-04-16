---
x-i18n:
    generated_at: "2026-04-16T06:56:49Z"
    model: gpt-5.4
    provider: openai
    source_hash: 95e56c5411204363676f002059c942201503e2359515d1a4b409882cc2e04920
    source_path: refactor/async-exec-duplicate-completion-investigation.md
    workflow: 15
---

# Enquête sur les doublons de fin d’exécution asynchrone

## Périmètre

- Session : `agent:main:telegram:group:-1003774691294:topic:1`
- Symptôme : la même fin d’exécution asynchrone pour la session/l’exécution `keen-nexus` a été enregistrée deux fois dans LCM comme tours utilisateur.
- Objectif : déterminer s’il s’agit très probablement d’une injection de session en double ou d’une simple nouvelle tentative de livraison sortante.

## Conclusion

Il s’agit très probablement d’une **injection de session en double**, et non d’une simple nouvelle tentative de livraison sortante.

La faille la plus nette côté Gateway se trouve dans le **chemin de fin d’exécution du Node** :

1. Une fin d’exécution côté Node émet `exec.finished` avec le `runId` complet.
2. Le Gateway `server-node-events` convertit cela en événement système et demande un Heartbeat.
3. L’exécution Heartbeat injecte le bloc d’événements système vidangé dans le prompt de l’agent.
4. Le runner embarqué persiste ce prompt comme un nouveau tour utilisateur dans la transcription de session.

Si le même `exec.finished` atteint le Gateway deux fois pour le même `runId` pour n’importe quelle raison (relecture, doublon à la reconnexion, renvoi en amont, producteur dupliqué), OpenClaw n’a actuellement **aucun contrôle d’idempotence indexé sur `runId`/`contextKey`** sur ce chemin. La seconde copie devient alors un second message utilisateur avec le même contenu.

## Chemin de code exact

### 1. Producteur : événement de fin d’exécution du Node

- `src/node-host/invoke.ts:340-360`
  - `sendExecFinishedEvent(...)` émet `node.event` avec l’événement `exec.finished`.
  - La charge utile inclut `sessionKey` et le `runId` complet.

### 2. Ingestion de l’événement par le Gateway

- `src/gateway/server-node-events.ts:574-640`
  - Gère `exec.finished`.
  - Construit le texte :
    - `Exec finished (node=..., id=<runId>, code ...)`
  - Le met en file via :
    - `enqueueSystemEvent(text, { sessionKey, contextKey: runId ? \`exec:${runId}\` : "exec", trusted: false })`
  - Demande immédiatement un réveil :
    - `requestHeartbeatNow(scopedHeartbeatWakeOptions(sessionKey, { reason: "exec-event" }))`

### 3. Faiblesse de déduplication des événements système

- `src/infra/system-events.ts:90-115`
  - `enqueueSystemEvent(...)` ne supprime que les **doublons de texte consécutifs** :
    - `if (entry.lastText === cleaned) return false`
  - Il stocke `contextKey`, mais n’utilise **pas** `contextKey` pour l’idempotence.
  - Après vidange, la suppression des doublons est réinitialisée.

Cela signifie qu’un `exec.finished` rejoué avec le même `runId` peut être accepté de nouveau plus tard, alors même que le code disposait déjà d’un candidat stable pour l’idempotence (`exec:<runId>`).

### 4. La gestion des réveils n’est pas le duplicateur principal

- `src/infra/heartbeat-wake.ts:79-117`
  - Les réveils sont fusionnés par `(agentId, sessionKey)`.
  - Les demandes de réveil en double pour la même cible sont regroupées en une seule entrée de réveil en attente.

Cela fait de la **duplication dans la seule gestion des réveils** une explication moins solide qu’une ingestion d’événement en double.

### 5. Heartbeat consomme l’événement et le transforme en entrée de prompt

- `src/infra/heartbeat-runner.ts:535-574`
  - Le précontrôle examine les événements système en attente et classe les exécutions de type exec-event.
- `src/auto-reply/reply/session-system-events.ts:86-90`
  - `drainFormattedSystemEvents(...)` vide la file pour la session.
- `src/auto-reply/reply/get-reply-run.ts:400-427`
  - Le bloc d’événements système vidé est préfixé au corps du prompt de l’agent.

### 6. Point d’injection dans la transcription

- `src/agents/pi-embedded-runner/run/attempt.ts:2000-2017`
  - `activeSession.prompt(effectivePrompt)` envoie le prompt complet à la session PI embarquée.
  - C’est à cet endroit que le prompt issu de la fin d’exécution devient un tour utilisateur persisté.

Ainsi, dès lors que le même événement système est reconstruit dans le prompt deux fois, des messages utilisateur LCM dupliqués sont attendus.

## Pourquoi une simple nouvelle tentative de livraison sortante est moins probable

Il existe bien un chemin d’échec sortant dans le runner Heartbeat :

- `src/infra/heartbeat-runner.ts:1194-1242`
  - La réponse est générée d’abord.
  - La livraison sortante a lieu ensuite via `deliverOutboundPayloads(...)`.
  - Un échec à cet endroit renvoie `{ status: "failed" }`.

Cependant, pour la même entrée de file d’événement système, cela **ne suffit pas** à expliquer les tours utilisateur dupliqués :

- `src/auto-reply/reply/session-system-events.ts:86-90`
  - La file d’événements système est déjà vidée avant la livraison sortante.

Donc, une simple nouvelle tentative d’envoi sur le canal, à elle seule, ne recréerait pas exactement la même entrée en file. Elle pourrait expliquer une livraison externe manquante ou ratée, mais pas à elle seule un second message utilisateur identique dans la session.

## Possibilité secondaire, avec un niveau de confiance plus faible

Il existe une boucle complète de nouvelle tentative d’exécution dans le runner de l’agent :

- `src/auto-reply/reply/agent-runner-execution.ts:741-1473`
  - Certains échecs transitoires peuvent relancer toute l’exécution et soumettre à nouveau le même `commandBody`.

Cela peut dupliquer un prompt utilisateur persisté **au sein de la même exécution de réponse** si le prompt a déjà été ajouté avant que la condition de nouvelle tentative ne se déclenche.

Je classe cette hypothèse derrière l’ingestion en double de `exec.finished` parce que :

- l’intervalle observé était d’environ 51 secondes, ce qui ressemble davantage à un second réveil/tour qu’à une nouvelle tentative en cours de processus ;
- le signalement mentionne déjà des échecs répétés d’envoi de messages, ce qui oriente davantage vers un second tour distinct et ultérieur que vers une nouvelle tentative immédiate du modèle/runtime.

## Hypothèse de cause racine

Hypothèse avec le plus haut niveau de confiance :

- La fin `keen-nexus` est passée par le **chemin d’événement d’exécution du Node**.
- Le même `exec.finished` a été livré deux fois à `server-node-events`.
- Le Gateway a accepté les deux, car `enqueueSystemEvent(...)` ne déduplique pas par `contextKey` / `runId`.
- Chaque événement accepté a déclenché un Heartbeat et a été injecté comme tour utilisateur dans la transcription PI.

## Correctif chirurgical proposé

Si un correctif est souhaité, le plus petit changement à forte valeur serait :

- faire en sorte que l’idempotence des événements exec/système respecte `contextKey` sur un court horizon, au moins pour les répétitions exactes de `(sessionKey, contextKey, text)` ;
- ou ajouter une déduplication dédiée dans `server-node-events` pour `exec.finished`, indexée par `(sessionKey, runId, kind d’événement)`.

Cela bloquerait directement les doublons rejoués de `exec.finished` avant qu’ils ne deviennent des tours de session.
