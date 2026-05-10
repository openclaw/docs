---
read_when:
    - Verifica del motivo per cui la rifattorizzazione dell'ingresso del canale ha aggiunto troppo codice
    - Spostamento delle policy di route, comando, evento, attivazione o gruppo di accesso dai Plugin in bundle nel nucleo
    - Verifica se una funzione di supporto per l'ingresso del canale elimina effettivamente il codice del Plugin incluso
sidebarTitle: Ingress core deletion
summary: Piano con priorità all'eliminazione per spostare nel nucleo il codice di raccordo ripetuto per l'ingresso dei canali.
title: Piano di eliminazione del nucleo di ingresso
x-i18n:
    generated_at: "2026-05-10T19:50:40Z"
    model: gpt-5.5
    provider: openai
    source_hash: 71afcf5d4f58c57ecfe7b388325279700a723ec1fcd926f644095106b662c3d0
    source_path: refactor/ingress-core.md
    workflow: 16
---

# Piano di eliminazione del core di ingresso

Il refactor dell'ingresso non è sano se aggiunge migliaia di righe nette. La
centralizzazione nel core conta solo quando il codice di produzione dei Plugin
inclusi si riduce e la compatibilità con il vecchio SDK di terze parti viene
confinata agli shim SDK/core.

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

I Plugin inclusi non devono tradurre di nuovo l'ingresso nelle forme locali
`AccessResult`, `GroupAccessDecision`, `CommandAuthDecision`, `DmCommandAccess` o
`{ allowed, reasonCode }`, a meno che quel tipo non faccia parte dell'API
pubblica dei Plugin.

## Budget

Misurato rispetto alla base di merge della PR con `origin/main`, includendo i
file non tracciati.

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

L'eliminazione di soli commenti non conta come pulizia. Il passaggio precedente
sul budget è stato troppo generoso perché includeva commenti esplicativi QQBot
ripristinati; questo documento traccia solo lo spostamento di codice
eseguibile/docs/test.

Rimisurare dopo ogni ondata di pulizia:

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

- eliminare i DTO dei Plugin che rinominano soltanto campi dell'ingresso
- eliminare i test che verificano soltanto la forma del wrapper
- aggiungere helper core solo quando la stessa patch elimina codice dei Plugin inclusi
- mantenere la vecchia compatibilità SDK solo negli shim SDK/core
- ricompattare il core dopo che l'eliminazione dei wrapper espone la forma stabile

## Punti critici

File di produzione dei Plugin inclusi con delta positivo che devono ancora
ridursi:

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

Il branch non rientra ancora nel budget minimo. Il lavoro rimanente rilevante
per la revisione dovrebbe eliminare flussi di autorizzazione ripetuti,
scaffolding dei turni o test dei wrapper prima di aggiungere un'altra astrazione
nel core.

## Lettura del codice attuale

Il punto di integrazione sano nel core esiste già in `src/channels/message-access/runtime.ts`:
gestisce adattatori di identità, allowlist effettive, letture del pairing store,
descrittori di route, preset di comandi/eventi, gruppi di accesso e la proiezione
finale risolta `ResolvedChannelMessageIngress`.

La crescita rimanente è per lo più colla dei Plugin stratificata sopra quel punto
di integrazione:

- `extensions/telegram/src/ingress.ts` avvolge le decisioni core in helper
  Telegram-specifici per comandi/eventi, poi i call site continuano a passare
  allowlist normalizzate e liste di owner precalcolate.
- `extensions/discord/src/monitor/dm-command-auth.ts`,
  `extensions/feishu/src/policy.ts`, `extensions/googlechat/src/monitor-access.ts`
  e `extensions/matrix/src/matrix/monitor/access-state.ts` mantengono ancora
  DTO di policy locali o nomi di decisioni legacy accanto all'ingresso.
- `extensions/signal/src/monitor/access-policy.ts` mantiene correttamente locali
  la normalizzazione dell'identità Signal e le risposte di pairing, ma ha ancora
  un punto di wrapper che dovrebbe collassare nel consumo diretto dell'ingresso.
- `extensions/nextcloud-talk/src/inbound.ts`, `extensions/irc/src/inbound.ts`,
  `extensions/qa-channel/src/inbound.ts`, `extensions/zalo/src/monitor.ts` e
  `extensions/zalouser/src/monitor.ts` ripetono ancora l'assemblaggio di
  route/envelope/turno che può spostarsi in helper di turno condivisi fuori dal
  kernel di ingresso.

Conclusione: spostare altro codice nel core è utile solo se elimina questi strati
di wrapper dei Plugin nella stessa patch. Aggiungere un'altra astrazione lasciando
al loro posto i ritorni dei wrapper ripete l'errore.

## Confine

Il core gestisce la policy generica:

- normalizzazione e corrispondenza delle allowlist
- espansione dei gruppi di accesso e diagnostica
- letture delle allowlist DM dal pairing store
- gate di route, mittente, comando, evento e attivazione
- mappatura dell'ammissione: dispatch, drop, skip, observe, pairing
- stato redatto, decisioni, diagnostica e proiezioni di compatibilità SDK
- descrittori generici riutilizzabili per identità, route, comando, evento,
  attivazione ed esiti

I Plugin gestiscono i fatti di trasporto e gli effetti collaterali:

- autenticità di webhook/socket/richiesta
- estrazione dell'identità della piattaforma e lookup API
- default di policy specifici del canale
- consegna della sfida di pairing, risposte, ack, reazioni, digitazione, media,
  cronologia, setup, doctor, stato, log e testo visibile all'utente

Il core deve restare agnostico rispetto al canale: nessun Discord, Slack,
Telegram, Matrix, stanza, guild, space, client API o default specifico del Plugin
in `src/channels/message-access`.

## Regola di accettazione

Ogni nuovo helper core deve eliminare immediatamente codice di produzione dei
Plugin inclusi.

```text
one bundled caller        reject; keep plugin-local
two bundled callers       accept only if plugin production LOC drops
three or more callers     plugin deletion must be at least 2x new core LOC
compatibility-only helper SDK/core shim only; never bundled hot paths
```

Fermarsi e riprogettare se:

- le LOC di produzione dei Plugin aumentano
- i test crescono più rapidamente di quanto si riduca la produzione
- un hot path incluso restituisce un DTO che rinomina soltanto `ResolvedChannelMessageIngress`
- un helper core richiede un id di canale, un oggetto piattaforma, un client API
  o un default specifico del canale

## Pacchetti di lavoro

1. Congelare il budget.
   Inserire le LOC nella PR, mantenere verde il lint deprecated-ingress e includere
   le LOC prima/dopo nei commit di pulizia.

2. Eliminare i punti di DTO sottili.
   Sostituire i ritorni dei wrapper locali ai Plugin con
   `ResolvedChannelMessageIngress`, `senderAccess`, `commandAccess`, `routeAccess`
   o `ingress` direttamente. Iniziare con QQBot, Telegram, Slack, Discord,
   Signal, Feishu, Matrix, iMessage e Tlon. Eliminare i test sulla forma dei
   wrapper; mantenere i test di comportamento.

3. Aggiungere la classificazione degli esiti solo insieme a eliminazioni.
   Un classificatore generico può esporre `dispatch`, `pairing-required`,
   `skip-activation`, `drop-command`, `drop-route`, `drop-sender` e
   `drop-ingress`. Deve derivare dal grafo decisionale, non dalle stringhe di
   motivazione, e migrare almeno tre Plugin nella stessa patch.

4. Aggiungere builder di descrittori di route solo insieme a eliminazioni.
   Helper generici per target di route e mittente di route sono accettabili solo
   se riducono immediatamente i Plugin ricchi di route: Google Chat, IRC,
   Microsoft Teams, Nextcloud Talk, Mattermost, Slack, Zalo e Zalo Personal.

5. Aggiungere preset di comandi/eventi solo insieme a eliminazioni.
   Centralizzare le forme text-command, native-command, callback e origin-subject.
   I consumer di comandi devono avere come default non autorizzato quando non è
   stato eseguito alcun gate di comando; gli eventi non devono avviare pairing.

6. Aggiungere preset di identità solo dove rimuovono boilerplate.
   Helper stable-id, stable-id-plus-aliases, phone/e164 e multi-identifier sono
   consentiti quando i valori grezzi entrano solo nell'input dell'adattatore e lo
   stato redatto mantiene id/conteggi opachi.

7. Condividere l'assemblaggio dei turni autorizzati.
   Fuori dal kernel di ingresso, rimuovere lo scaffolding ripetuto di
   route/envelope/context/reply da QA Channel, IRC, Nextcloud Talk, Zalo e Zalo
   Personal. Il core può gestire la sequenza route/session/envelope/dispatch; i
   Plugin mantengono consegna e contesto specifico del canale.

8. Confinare la compatibilità.
   Gli helper SDK deprecati restano compatibili a livello sorgente, ma gli hot
   path inclusi non devono importare facade di ingresso o command-auth deprecate.
   I test di compatibilità devono usare finti Plugin di terze parti, non
   componenti interni dei Plugin inclusi.

9. Ricompattare il core.
   Dopo che i Plugin consumano direttamente le proiezioni runtime, collassare i
   moduli monouso, rimuovere export inutilizzati, spostare la proiezione di
   compatibilità fuori dagli hot path e mantenere test mirati per identità,
   route, comando/evento, attivazione, gruppi di accesso e shim di compatibilità.

## Ondate di eliminazione

Eseguire queste operazioni in ordine. Ogni ondata deve ridurre le LOC di
produzione dei Plugin inclusi.

1. Collasso dei wrapper, delta Plugin previsto: da -400 a -600.
   Sostituire i tipi di risultato Plugin-locali `resolveXAccess`,
   `resolveXCommandAccess` e `accessFromIngress` con letture dirette da
   `ResolvedChannelMessageIngress`. Primi target: autorizzazione comandi DM
   Discord, policy Feishu, stato di accesso Matrix, ingresso Telegram, policy di
   accesso Signal, adattatore SDK QQBot.

2. Helper di esito condivisi, delta Plugin previsto: da -200 a -350.
   Aggiungere un solo classificatore generico solo se elimina ladder ripetuti di
   `shouldBlockControlCommand`, pairing, skip di attivazione, blocco di route e
   blocco del mittente in almeno tre Plugin.

3. Builder di descrittori di route, delta Plugin previsto: da -200 a -350.
   Spostare l'assemblaggio ripetuto dei descrittori di target di route e mittente
   di route in helper core. Primi target: Google Chat, IRC, Microsoft Teams,
   Nextcloud Talk, Mattermost, Slack, Zalo, Zalo Personal.

4. Condivisione dell'assemblaggio dei turni, delta Plugin previsto: da -250 a -450.
   Usare una sequenza comune route/session/envelope/dispatch per Plugin inbound
   semplici. Primi target: QA Channel, IRC, Nextcloud Talk, Zalo, Zalo Personal.

5. Ricompattazione del core, delta core previsto: da -300 a -700.
   Dopo che i Plugin consumano direttamente le proiezioni runtime, eliminare i
   moduli monouso, fondere i file minuscoli di nuovo in `runtime.ts` o in sibling
   mirati, e mantenere i file di compatibilità SDK separati dagli hot path inclusi.

6. Potatura dei test, delta test previsto: da -300 a -600.
   Eliminare i test che verificano soltanto le forme dei wrapper rimossi.
   Mantenere test di comportamento per negazione comandi, fallback di gruppo,
   corrispondenza origin-subject, skip di attivazione, gruppi di accesso, pairing
   e redazione.

Forma minima attesa per il landing dopo queste ondate:

```text
plugin production     <= -1,500
core production       about +1,800 to +2,200 before final repack
tests                 <= +500
total                 <= +2,000
```

## Non spostare

Non spostare i valori predefiniti di configurazione della piattaforma, l'esperienza utente di configurazione, i testi di doctor/fix, le ricerche API,
i controlli Slack sulla presenza del proprietario, la gestione di alias/verifica Matrix, il parsing dei callback Telegram,
il parsing della sintassi dei comandi, la registrazione dei comandi nativi, il parsing dei payload di reazione, le risposte
di associazione, le risposte ai comandi, gli ack, la digitazione, i media, la cronologia,
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

Usa Testbox per gate modificati ampi/prova della suite completa una volta che l'andamento delle LOC è
entro il budget.

Ogni pacchetto di lavoro registra:

- LOC prima/dopo per categoria
- wrapper Plugin eliminati
- nuove LOC di helper core, se presenti
- test mirati eseguiti
- elenco dei punti critici rimanenti

## Criteri di uscita

- gli import di produzione inclusi non usano facade deprecate di channel-access o command-auth
- il codice di compatibilità è isolato nei punti di integrazione SDK/core
- i Plugin inclusi consumano direttamente proiezioni di ingresso o esiti generici
- le LOC di produzione dei Plugin sono almeno 1.500 nette negative rispetto a `origin/main`
- le LOC di produzione core sono <= +1.500, oppure qualsiasi eccedenza viene compensata mentre il totale resta
  <= +2.000
- test rappresentativi coprono redazione, route, comando/evento, attivazione,
  access-group e comportamento di fallback specifico del canale
