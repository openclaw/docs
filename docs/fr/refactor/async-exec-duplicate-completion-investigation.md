---
read_when:
    - Débogage des événements répétés de complétion d’exécution de nœud
    - Travail sur la déduplication Heartbeat/system-event
summary: Notes d’investigation sur l’injection en double de complétion d’exécution asynchrone
title: Investigation sur la complétion en double de l’exécution asynchrone
x-i18n:
    generated_at: "2026-04-23T07:10:37Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8b0a3287b78bbc4c41e4354e9062daba7ae790fa207eee9a5f77515b958b510b
    source_path: refactor/async-exec-duplicate-completion-investigation.md
    workflow: 15
---

# Investigation sur la complétion en double de l’exécution asynchrone

## Portée

- Session : `agent:main:telegram:group:-1003774691294:topic:1`
- Symptôme : la même complétion d’exécution asynchrone pour la session/l’exécution `keen-nexus` a été enregistrée deux fois dans LCM comme des tours utilisateur.
- Objectif : identifier s’il s’agit plus probablement d’une injection de session en double ou d’une simple nouvelle tentative de livraison sortante.

## Conclusion

Il s’agit très probablement d’une **injection de session en double**, et non d’une simple nouvelle tentative de livraison sortante.

La faille la plus importante côté gateway se trouve dans le **chemin de complétion d’exécution de nœud** :

1. Une fin d’exécution côté nœud émet `exec.finished` avec le `runId` complet.
2. La Gateway `server-node-events` convertit cela en événement système et demande un Heartbeat.
3. L’exécution du Heartbeat injecte le bloc d’événement système vidé dans le prompt de l’agent.
4. L’exécuteur intégré persiste ce prompt comme un nouveau tour utilisateur dans la transcription de session.

Si le même `exec.finished` atteint la gateway deux fois pour le même `runId` pour une raison quelconque (relecture, doublon de reconnexion, renvoi en amont, producteur dupliqué), OpenClaw n’a actuellement **aucune vérification d’idempotence indexée par `runId`/`contextKey`** sur ce chemin. La seconde copie deviendra un second message utilisateur avec le même contenu.

## Chemin de code exact

### 1. Producteur : événement de complétion d’exécution de nœud

- `src/node-host/invoke.ts:340-360`
  - `sendExecFinishedEvent(...)` émet `node.event` avec l’événement `exec.finished`.
  - La charge utile inclut `sessionKey` et le `runId` complet.

### 2. Ingestion des événements par la Gateway

- `src/gateway/server-node-events.ts:574-640`
  - Gère `exec.finished`.
  - Construit le texte :
    - `Exec finished (node=..., id=<runId>, code ...)`
  - Le met en file avec :
    - `enqueueSystemEvent(text, { sessionKey, contextKey: runId ? \`exec:${runId}\` : "exec", trusted: false })`
  - Demande immédiatement un réveil :
    - `requestHeartbeatNow(scopedHeartbeatWakeOptions(sessionKey, { reason: "exec-event" }))`

### 3. Faiblesse de déduplication des événements système

- `src/infra/system-events.ts:90-115`
  - `enqueueSystemEvent(...)` ne supprime que les **doublons de texte consécutifs** :
    - `if (entry.lastText === cleaned) return false`
  - Il stocke `contextKey`, mais **n’utilise pas** `contextKey` pour l’idempotence.
  - Après vidage, la suppression des doublons est réinitialisée.

Cela signifie qu’un `exec.finished` rejoué avec le même `runId` peut être accepté de nouveau plus tard, alors même que le code disposait déjà d’un candidat d’idempotence stable (`exec:<runId>`).

### 4. La gestion du réveil n’est pas le duplicateur principal

- `src/infra/heartbeat-wake.ts:79-117`
  - Les réveils sont fusionnés par `(agentId, sessionKey)`.
  - Les demandes de réveil en double pour la même cible se réduisent à une seule entrée de réveil en attente.

Cela fait de la **gestion des réveils en double à elle seule** une explication plus faible que l’ingestion d’événement en double.

### 5. Le Heartbeat consomme l’événement et le transforme en entrée de prompt

- `src/infra/heartbeat-runner.ts:535-574`
  - Le preflight inspecte les événements système en attente et classe les exécutions de type exec-event.
- `src/auto-reply/reply/session-system-events.ts:86-90`
  - `drainFormattedSystemEvents(...)` vide la file pour la session.
- `src/auto-reply/reply/get-reply-run.ts:400-427`
  - Le bloc d’événement système vidé est préfixé dans le corps du prompt de l’agent.

### 6. Point d’injection dans la transcription

- `src/agents/pi-embedded-runner/run/attempt.ts:2000-2017`
  - `activeSession.prompt(effectivePrompt)` soumet le prompt complet à la session PI intégrée.
  - C’est le point où le prompt dérivé de la complétion devient un tour utilisateur persisté.

Donc, une fois que le même événement système est reconstruit dans le prompt deux fois, des messages utilisateur LCM en double sont attendus.

## Pourquoi une simple nouvelle tentative de livraison sortante est moins probable

Il existe un vrai chemin d’échec sortant dans l’exécuteur de Heartbeat :

- `src/infra/heartbeat-runner.ts:1194-1242`
  - La réponse est d’abord générée.
  - La livraison sortante se produit plus tard via `deliverOutboundPayloads(...)`.
  - Un échec à cet endroit renvoie `{ status: "failed" }`.

Cependant, pour la même entrée de file d’événement système, cela seul **ne suffit pas** à expliquer les tours utilisateur en double :

- `src/auto-reply/reply/session-system-events.ts:86-90`
  - La file d’événement système est déjà vidée avant la livraison sortante.

Donc, une nouvelle tentative d’envoi de canal à elle seule ne recréerait pas exactement le même événement mis en file. Elle pourrait expliquer une livraison externe manquante/en échec, mais pas à elle seule un second message utilisateur de session identique.

## Possibilité secondaire, avec un niveau de confiance plus faible

Il existe une boucle complète de nouvelle tentative dans l’exécuteur d’agent :

- `src/auto-reply/reply/agent-runner-execution.ts:741-1473`
  - Certains échecs transitoires peuvent relancer l’exécution complète et soumettre de nouveau le même `commandBody`.

Cela peut dupliquer un prompt utilisateur persisté **dans la même exécution de réponse** si le prompt a déjà été ajouté avant le déclenchement de la condition de nouvelle tentative.

Je classe cette hypothèse plus bas que l’ingestion dupliquée de `exec.finished` parce que :

- l’écart observé était d’environ 51 secondes, ce qui ressemble davantage à un second réveil/tour qu’à une nouvelle tentative en processus ;
- le signalement mentionne déjà des échecs répétés d’envoi de message, ce qui pointe davantage vers un tour séparé ultérieur que vers une nouvelle tentative immédiate du modèle/runtime.

## Hypothèse de cause racine

Hypothèse avec le plus haut niveau de confiance :

- La complétion `keen-nexus` est passée par le **chemin d’événement d’exécution de nœud**.
- Le même `exec.finished` a été livré deux fois à `server-node-events`.
- La Gateway a accepté les deux parce que `enqueueSystemEvent(...)` ne déduplique pas par `contextKey` / `runId`.
- Chaque événement accepté a déclenché un Heartbeat et a été injecté comme tour utilisateur dans la transcription PI.

## Correctif chirurgical minime proposé

Si un correctif est souhaité, le changement à plus forte valeur et le plus petit est :

- faire en sorte que l’idempotence des événements système/d’exécution respecte `contextKey` sur un horizon court, au moins pour les répétitions exactes de `(sessionKey, contextKey, text)` ;
- ou ajouter une déduplication dédiée dans `server-node-events` pour `exec.finished`, indexée par `(sessionKey, runId, type d’événement)`.

Cela bloquerait directement les doublons rejoués de `exec.finished` avant qu’ils ne deviennent des tours de session.
