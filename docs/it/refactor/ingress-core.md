---
read_when:
    - Analisi del motivo per cui il refactoring dell’ingresso del canale ha aggiunto troppo codice
    - Spostamento della policy di route, comando, evento, attivazione o gruppo di accesso dai Plugin inclusi al core
    - Verifica se un helper di ingresso del canale elimina effettivamente il codice del Plugin in bundle
sidebarTitle: Ingress core deletion
summary: Piano basato prima sull'eliminazione per spostare nel nucleo la logica di raccordo ripetuta per l'ingresso dei canali.
title: Piano di eliminazione del nucleo di ingresso
x-i18n:
    generated_at: "2026-05-12T00:59:39Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1fdf1e7c9636d02c48c4b5d2b4a51470317dd64e2270c7fae779777c0d787afc
    source_path: refactor/ingress-core.md
    workflow: 16
    postprocess_version: locale-links-v1
---

# Piano di eliminazione del core di ingresso

Il refactoring dell'ingresso non è sano finché aggiunge migliaia di righe nette. La
centralizzazione nel core conta solo quando il codice di produzione dei Plugin
inclusi diventa più piccolo e la compatibilità del vecchio SDK di terze parti
è isolata negli shim SDK/core.

Forma di runtime desiderata:

```text
bundled plugin event
  -> extract platform facts locally
  -> resolve shared ingress once when facts are available
  -> branch on generic ingress projections/outcomes
  -> perform platform side effects locally

old third-party helper
  -> SDK compatibility shim
  -> shared ingress-compatible projection where possible
  -> old return shape preserved
```

I Plugin inclusi non devono tradurre l'ingresso di nuovo in forme locali
`AccessResult`, `GroupAccessDecision`, `CommandAuthDecision`, `DmCommandAccess` o
`{ allowed, reasonCode }`, a meno che quel tipo non faccia parte dell'API pubblica
del Plugin.

## Budget

Misurato rispetto alla merge-base della PR con `origin/main`, inclusi i file non
tracciati.

```text
merge-base            1671e7532adb

current:
core production       +3,922 / -546    = +3,376
docs                  +601 / -17       = +584
other                 +145 / -2        = +143
plugin production     +4,148 / -5,388  = -1,240
tests                 +2,326 / -2,414  = -88
total                 +11,142 / -8,367 = +2,775

required:
plugin production     <= -1,500
core production       <= +1,500, or paid for by larger plugin deletion
tests                 <= +1,000
total                 <= +2,000

stretch:
plugin production     <= -2,500
core production       <= +1,200
total                 <= 0
```

Pulizia minima rimanente:

```text
plugin production     needs 260 more net deleted lines
total                 needs 775 more net deleted lines
core production       still +1,876 over standalone budget, unless paid down by plugin deletion
```

L'eliminazione dei soli commenti non conta come pulizia. Il passaggio precedente
sul budget era troppo generoso perché includeva commenti esplicativi di QQBot
ripristinati; questo documento traccia solo lo spostamento di codice eseguibile,
documentazione e test.

Rimisura dopo ogni ondata di pulizia:

```sh
base=$(git merge-base HEAD origin/main)
git diff --shortstat "$base"
git diff --numstat "$base" -- src/channels/message-access src/plugin-sdk extensions | sort -nr -k1 | head -n 80
pnpm lint:extensions:no-deprecated-channel-access
```

## Diagnosi

Il primo passaggio ha aggiunto il kernel di ingresso condiviso, poi ha lasciato
troppa autorizzazione locale ai Plugin accanto a esso:

```text
platform facts
  -> shared ingress state and decision
  -> plugin-local DTO or legacy projection
  -> plugin-local if/else ladder
```

Questo duplica il modello. Il codice di produzione del core è cresciuto di circa
3.376 righe, mentre il codice di produzione dei Plugin inclusi è più piccolo di
1.240 righe. È meglio del primo passaggio, ma non rientra nel budget minimo. La
correzione resta orientata prima di tutto all'eliminazione:

- elimina i DTO dei Plugin che rinominano soltanto campi di ingresso
- elimina i test che verificano soltanto la forma dei wrapper
- aggiungi helper del core solo quando la stessa patch elimina codice dei Plugin inclusi
- mantieni la vecchia compatibilità SDK soltanto negli shim SDK/core
- ricompatta il core dopo che l'eliminazione dei wrapper espone la forma stabile

## Punti caldi

File di produzione inclusi positivi che devono ancora ridursi:

```text
extensions/telegram/src/ingress.ts                        +126
extensions/discord/src/monitor/dm-command-auth.ts         +101
extensions/signal/src/monitor/access-policy.ts             +92
extensions/feishu/src/policy.ts                            +85
extensions/slack/src/monitor/auth.ts                       +64
extensions/googlechat/src/monitor-access.ts                +59
extensions/nextcloud-talk/src/inbound.ts                   +51
extensions/matrix/src/matrix/monitor/access-state.ts       +49
extensions/irc/src/inbound.ts                              +44
extensions/imessage/src/monitor/inbound-processing.ts      +36
extensions/qa-channel/src/inbound.ts                       +34
extensions/qqbot/src/bridge/sdk-adapter.ts                 +33
extensions/tlon/src/monitor/utils.ts                       +30
extensions/twitch/src/access-control.ts                    +22
extensions/qqbot/src/engine/commands/slash-command-handler.ts +20
extensions/telegram/src/bot-handlers.runtime.ts            +19
```

Il ramo non rientra ancora nel budget minimo. Il restante lavoro rilevante per
la review dovrebbe eliminare il flusso di autorizzazione ripetuto, lo scaffolding
dei turni o i test dei wrapper prima di aggiungere un'altra astrazione nel core.

## Lettura del codice attuale

Il raccordo sano del core esiste già in `src/channels/message-access/runtime.ts`:
possiede adattatori di identità, allowlist effettive, letture del pairing-store,
descrittori di route, preset di comandi/eventi, gruppi di accesso e la proiezione
finale risolta `ResolvedChannelMessageIngress`.

La crescita rimanente è per lo più colla dei Plugin stratificata sopra quel
raccordo:

- `extensions/telegram/src/ingress.ts` avvolge le decisioni del core in helper
  specifici di Telegram per comandi/eventi, poi i call site continuano a passare
  allowlist normalizzate e liste di proprietari precomputate.
- `extensions/discord/src/monitor/dm-command-auth.ts`,
  `extensions/feishu/src/policy.ts`, `extensions/googlechat/src/monitor-access.ts`
  e `extensions/matrix/src/matrix/monitor/access-state.ts` mantengono ancora
  DTO di policy locali o nomi di decisione legacy accanto all'ingresso.
- `extensions/signal/src/monitor/access-policy.ts` mantiene correttamente locali
  la normalizzazione dell'identità e le risposte di pairing di Signal, ma ha
  ancora un raccordo wrapper che dovrebbe collassare nel consumo diretto
  dell'ingresso.
- `extensions/nextcloud-talk/src/inbound.ts`, `extensions/irc/src/inbound.ts`,
  `extensions/qa-channel/src/inbound.ts`, `extensions/zalo/src/monitor.ts` e
  `extensions/zalouser/src/monitor.ts` ripetono ancora l'assemblaggio di route,
  envelope e turni che può spostarsi in helper di turno condivisi fuori dal
  kernel di ingresso.

Conclusione: spostare più codice nel core è utile solo se elimina questi livelli
wrapper dei Plugin nella stessa patch. Aggiungere un'altra astrazione lasciando
in posizione i ritorni dei wrapper ripete l'errore.

## Confine

Il core possiede la policy generica:

- normalizzazione e matching delle allowlist
- espansione e diagnostica dei gruppi di accesso
- letture delle allowlist DM dal pairing-store
- gate di route, mittente, comando, evento e attivazione
- mapping di ammissione: dispatch, drop, skip, observe, pairing
- stato redatto, decisioni, diagnostica e proiezioni di compatibilità SDK
- descrittori generici riutilizzabili per identità, route, comando, evento,
  attivazione e risultati

I Plugin possiedono fatti di trasporto ed effetti collaterali:

- autenticità di webhook/socket/richiesta
- estrazione dell'identità della piattaforma e lookup API
- default di policy specifici del canale
- consegna della sfida di pairing, risposte, ack, reazioni, digitazione, media,
  cronologia, setup, doctor, stato, log e copy rivolto all'utente

Il core deve restare agnostico rispetto al canale: nessun default specifico di
Discord, Slack, Telegram, Matrix, room, guild, space, client API o Plugin in
`src/channels/message-access`.

## Regola di accettazione

Ogni nuovo helper del core deve eliminare immediatamente codice di produzione
dei Plugin inclusi.

```text
one bundled caller        reject; keep plugin-local
two bundled callers       accept only if plugin production LOC drops
three or more callers     plugin deletion must be at least 2x new core LOC
compatibility-only helper SDK/core shim only; never bundled hot paths
```

Fermati e riprogetta se:

- le LOC di produzione dei Plugin aumentano
- i test crescono più rapidamente di quanto si riduca la produzione
- un hot path incluso restituisce un DTO che rinomina soltanto `ResolvedChannelMessageIngress`
- un helper del core ha bisogno di un id canale, un oggetto piattaforma, un client
  API o un default specifico del canale

## Pacchetti di lavoro

1. Congela il budget.
   Inserisci le LOC nella PR, mantieni verde il lint deprecated-ingress e includi
   le LOC prima/dopo nei commit di pulizia.

2. Elimina i raccordi DTO sottili.
   Sostituisci i ritorni dei wrapper locali ai Plugin con `ResolvedChannelMessageIngress`,
   `senderAccess`, `commandAccess`, `routeAccess` o `ingress` direttamente. Inizia
   con QQBot, Telegram, Slack, Discord, Signal, Feishu, Matrix, iMessage e Tlon.
   Elimina i test sulla forma dei wrapper; mantieni i test di comportamento.

3. Aggiungi la classificazione dei risultati solo con eliminazioni.
   Un classificatore generico può esporre `dispatch`, `pairing-required`,
   `skip-activation`, `drop-command`, `drop-route`, `drop-sender` e
   `drop-ingress`. Deve derivare dal grafo decisionale, non da stringhe di
   motivo, e migrare almeno tre Plugin nella stessa patch.

4. Aggiungi builder di descrittori di route solo con eliminazioni.
   Gli helper generici per target di route e mittente di route sono accettabili
   solo se riducono immediatamente i Plugin ricchi di route: Google Chat, IRC,
   Microsoft Teams, Nextcloud Talk, Mattermost, Slack, Zalo e Zalo Personal.

5. Aggiungi preset di comandi/eventi solo con eliminazioni.
   Centralizza forme di comando testuale, comando nativo, callback e
   origin-subject. I consumer di comandi devono passare a non autorizzato quando
   non è stato eseguito alcun gate di comando; gli eventi non devono avviare il
   pairing.

6. Aggiungi preset di identità solo dove rimuovono boilerplate.
   Helper per id stabile, id stabile più alias, telefono/e164 e multi-identificatore
   sono consentiti quando i valori grezzi entrano solo nell'input dell'adattatore
   e lo stato redatto mantiene id/conteggi opachi.

7. Condividi l'assemblaggio dei turni autorizzati.
   Fuori dal kernel di ingresso, rimuovi lo scaffolding ripetuto di
   route/envelope/contesto/risposta da QA Channel, IRC, Nextcloud Talk, Zalo e
   Zalo Personal. Il core può possedere la sequenza route/sessione/envelope/dispatch;
   i Plugin mantengono consegna e contesto specifico del canale.

8. Isola la compatibilità.
   Gli helper SDK deprecati restano compatibili a livello di sorgente, ma gli hot
   path inclusi non devono importare facciate deprecate di ingresso o command-auth.
   I test di compatibilità devono usare Plugin di terze parti fittizi, non
   internals dei Plugin inclusi.

9. Ricompatta il core.
   Dopo che i Plugin consumano direttamente le proiezioni runtime, collassa i
   moduli monouso, rimuovi export inutilizzati, sposta la proiezione di
   compatibilità fuori dagli hot path e mantieni test mirati per identità, route,
   comando/evento, attivazione, gruppi di accesso e shim di compatibilità.

## Ondate di eliminazione

Eseguile in ordine. Ogni ondata deve ridurre le LOC di produzione incluse.

1. Collasso dei wrapper, delta Plugin previsto: da -400 a -600.
   Sostituisci i tipi di risultato `resolveXAccess`, `resolveXCommandAccess` e
   `accessFromIngress` locali ai Plugin con letture dirette da
   `ResolvedChannelMessageIngress`. Primi target: auth dei comandi DM Discord,
   policy Feishu, stato di accesso Matrix, ingresso Telegram, policy di accesso
   Signal, adattatore SDK QQBot.

2. Helper di risultati condivisi, delta Plugin previsto: da -200 a -350.
   Aggiungi un classificatore generico solo se elimina ladder ripetute di
   `shouldBlockControlCommand`, pairing, skip di attivazione, blocco di route e
   blocco del mittente in almeno tre Plugin.

3. Builder di descrittori di route, delta Plugin previsto: da -200 a -350.
   Sposta l'assemblaggio ripetuto di descrittori di target di route e mittente di
   route in helper del core. Primi target: Google Chat, IRC, Microsoft Teams,
   Nextcloud Talk, Mattermost, Slack, Zalo, Zalo Personal.

4. Condivisione dell'assemblaggio dei turni, delta Plugin previsto: da -250 a -450.
   Usa una sequenza comune route/sessione/envelope/dispatch per Plugin inbound
   semplici. Primi target: QA Channel, IRC, Nextcloud Talk, Zalo, Zalo Personal.

5. Ricompattazione del core, delta core previsto: da -300 a -700.
   Dopo che i Plugin consumano direttamente le proiezioni runtime, elimina i
   moduli monouso, unisci i file piccoli di nuovo in `runtime.ts` o in file
   sibling mirati e mantieni i file di compatibilità SDK separati dagli hot path
   inclusi.

6. Potatura dei test, delta test previsto: da -300 a -600.
   Elimina i test che verificano solo forme di wrapper rimosse. Mantieni i test
   di comportamento per diniego dei comandi, fallback di gruppo, matching
   origin-subject, skip di attivazione, gruppi di accesso, pairing e redazione.

Forma minima prevista per l'atterraggio dopo queste ondate:

```text
plugin production     <= -1,500
core production       about +1,800 to +2,200 before final repack
tests                 <= +500
total                 <= +2,000
```

## Non spostare

Non spostare i valori predefiniti della configurazione della piattaforma, la UX di configurazione, i testi di doctor/fix, le ricerche API,
i controlli di presenza del proprietario Slack, la gestione di alias/verifica Matrix, l’analisi dei callback Telegram,
l’analisi della sintassi dei comandi, la registrazione dei comandi nativi, l’analisi dei payload di reazione, le risposte di pairing, le risposte ai comandi, gli ack, la digitazione, i media, la cronologia
o i log.

## Verifica

Ciclo locale mirato:

```sh
pnpm lint:extensions:no-deprecated-channel-access
pnpm test src/channels/message-access/message-access.test.ts src/plugin-sdk/channel-ingress-runtime.test.ts src/plugin-sdk/access-groups.test.ts
pnpm test extensions/<changed-plugin>/src/...
pnpm plugin-sdk:api:check
pnpm config:docs:check
pnpm check:docs
git diff --check
```

Usa Testbox per prove ampie dei gate modificati/della suite completa quando l’andamento delle LOC è
entro il budget.

Ogni pacchetto di lavoro registra:

- LOC prima/dopo per categoria
- wrapper di Plugin eliminati
- nuove LOC di helper core, se presenti
- test mirati eseguiti
- elenco degli hotspot rimanenti

## Criteri di uscita

- le importazioni di produzione incluse non usano facade deprecate di channel-access o command-auth
- il codice di compatibilità è isolato nei punti di integrazione SDK/core
- i Plugin inclusi consumano direttamente le proiezioni di ingresso o gli esiti generici
- le LOC di produzione dei Plugin sono almeno 1.500 nette negative rispetto a `origin/main`
- le LOC di produzione core sono `<= +1,500`, oppure qualsiasi eccedenza viene compensata mentre il totale
  resta `<= +2,000`
- test rappresentativi coprono redazione, route, comando/evento, attivazione,
  access-group e comportamento di fallback specifico del canale
