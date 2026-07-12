---
read_when:
    - Stai eseguendo il debug dei rifiuti delle richieste del provider legati alla struttura della trascrizione
    - Stai modificando la logica di sanificazione delle trascrizioni o di riparazione delle chiamate agli strumenti
    - Stai esaminando le discrepanze negli ID delle chiamate agli strumenti tra i vari provider
summary: 'Riferimento: regole specifiche del provider per la sanitizzazione e la riparazione delle trascrizioni'
title: Igiene delle trascrizioni
x-i18n:
    generated_at: "2026-07-12T07:29:14Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 4c78d718106498e92c34e3ad6af452a340f230fa88fbf3da36a568e9814ec759
    source_path: reference/transcript-hygiene.md
    workflow: 16
---

OpenClaw applica **correzioni specifiche per provider** alle trascrizioni prima di un'esecuzione
(durante la creazione del contesto del modello). La maggior parte consiste in modifiche **in memoria** usate per
soddisfare i rigidi requisiti dei provider. Un passaggio separato di riparazione del file di sessione può
anche riscrivere i dati JSONL archiviati prima del caricamento della sessione, ma solo in presenza di
righe non valide o turni persistenti che non costituiscono record durevoli validi.
Le risposte dell'assistente recapitate vengono conservate su disco; la rimozione dei
prefill dell'assistente specifica per provider avviene solo durante la costruzione dei
payload in uscita.

Quando viene effettuata una riparazione, il file originale viene scritto in un file
adiacente temporaneo `*.bak-<pid>-<ts>` prima della sostituzione atomica, quindi rimosso quando
la sostituzione ha esito positivo. Il backup viene conservato solo se la pulizia non riesce,
nel qual caso viene restituito il percorso.

L'ambito include:

- Esclusione del contesto del prompt riservato al runtime dai turni della trascrizione visibili all'utente
- Sanificazione degli ID delle chiamate agli strumenti
- Convalida dell'input delle chiamate agli strumenti
- Riparazione dell'associazione dei risultati degli strumenti
- Convalida/ordinamento dei turni
- Pulizia delle firme dei pensieri
- Pulizia delle firme di ragionamento
- Sanificazione dei payload delle immagini
- Pulizia dei blocchi di testo vuoti prima della riproduzione per il provider
- Pulizia dei turni incompleti per limite di lunghezza contenenti solo ragionamento prima della riproduzione per il provider
- Aggiunta di tag di provenienza all'input dell'utente (per i prompt instradati tra sessioni)
- Riparazione dei turni di errore vuoti dell'assistente per la riproduzione di Bedrock Converse

Per i dettagli sull'archiviazione delle trascrizioni, consulta
[Approfondimento sulla gestione delle sessioni](/it/reference/session-management-compaction).

---

## Regola globale: il contesto di runtime non è la trascrizione dell'utente

Il contesto di runtime/sistema può essere aggiunto al prompt del modello per un turno, ma non è
contenuto creato dall'utente finale. OpenClaw mantiene un corpo del prompt separato destinato alla
trascrizione per le risposte del Gateway, i follow-up in coda, ACP, CLI e le esecuzioni
incorporate di OpenClaw. I turni utente visibili archiviati usano tale corpo della trascrizione anziché
il prompt arricchito con il contesto di runtime.

Per le sessioni legacy che hanno già reso persistenti i wrapper di runtime, le superfici della cronologia del Gateway
applicano una proiezione di visualizzazione prima di restituire i messaggi ai client WebChat,
TUI, REST o SSE.

---

## Dove viene eseguito

Tutta la gestione dell'integrità delle trascrizioni è centralizzata nell'esecutore incorporato:

- Selezione dei criteri: `src/agents/transcript-policy.ts`
  (`resolveTranscriptPolicy`, basata su `provider`, `modelApi` e `modelId`)
- Applicazione della sanificazione/riparazione: `sanitizeSessionHistory` in
  `src/agents/embedded-agent-runner/replay-history.ts`

Separatamente dalla gestione dell'integrità delle trascrizioni, i file di sessione vengono riparati (se necessario)
prima del caricamento:

- `repairSessionFileIfNeeded` in `src/agents/session-file-repair.ts`
- Chiamata da `src/agents/embedded-agent-runner/run/attempt.ts` e
  `src/agents/embedded-agent-runner/compact.ts`

---

## Regola globale: sanificazione delle immagini

I payload delle immagini vengono sempre sanificati per evitare che il provider li rifiuti a causa dei
limiti di dimensione (ridimensionamento/ricompressione delle immagini base64 troppo grandi). Ciò contribuisce anche
a controllare il consumo di token causato dalle immagini per i modelli con capacità visive: dimensioni massime
inferiori riducono l'utilizzo di token, mentre dimensioni superiori preservano i dettagli.

Implementazione:

- `sanitizeSessionMessagesImages` in
  `src/agents/embedded-agent-helpers/images.ts`
- `sanitizeContentBlocksImages` in `src/agents/tool-images.ts`
- Il lato massimo dell'immagine è configurabile tramite `agents.defaults.imageMaxDimensionPx`
  (valore predefinito: `1200`)
- I blocchi di testo vuoti vengono rimossi mentre questo passaggio esamina il contenuto da riprodurre.
  I turni dell'assistente che diventano vuoti vengono eliminati dalla copia da riprodurre; i turni
  dell'utente e dei risultati degli strumenti che diventano vuoti ricevono un segnaposto non vuoto
  per il contenuto omesso.

---

## Regola globale: chiamate agli strumenti non valide

I blocchi delle chiamate agli strumenti dell'assistente privi sia di `input` sia di `arguments` vengono eliminati
prima della costruzione del contesto del modello. Ciò evita i rifiuti da parte del provider causati da
chiamate agli strumenti rese persistenti solo parzialmente (ad esempio, dopo un errore dovuto al limite di frequenza).

Implementazione:

- `sanitizeToolCallInputs` in `src/agents/session-transcript-repair.ts`
- Applicata in `sanitizeSessionHistory`
  (`src/agents/embedded-agent-runner/replay-history.ts`)

---

## Regola globale: turni incompleti contenenti solo ragionamento

I turni dell'assistente che raggiungono il limite di output del provider contenendo solo ragionamento o
contenuto di ragionamento oscurato vengono omessi dalla copia in memoria da riprodurre. Tali
turni contengono uno stato incompleto del provider e possono includere una firma di ragionamento
parziale.

I turni vuoti terminati per limite di lunghezza rimangono invariati, così come quelli con testo visibile,
chiamate agli strumenti o blocchi di contenuto sconosciuti. Le trascrizioni archiviate non vengono riscritte.

Implementazione: `normalizeAssistantReplayContent` in
`src/agents/embedded-agent-runner/replay-history.ts`

---

## Regola globale: provenienza dell'input tra sessioni

Quando un agente invia un prompt a un'altra sessione tramite `sessions_send`
(inclusi i passaggi di risposta/annuncio da agente ad agente), OpenClaw rende persistente il
turno utente creato con `message.provenance.kind = "inter_session"`.

OpenClaw antepone inoltre, nello stesso turno, un marcatore `[Messaggio tra sessioni] ... isUser=false`
prima del testo del prompt instradato, in modo che la chiamata attiva al modello possa
distinguere l'output di una sessione esterna dalle istruzioni dell'utente finale esterno. Questo
marcatore include la sessione, il canale e lo strumento di origine, quando disponibili. La
trascrizione continua a usare `role: "user"` per la compatibilità con il provider, ma sia il
testo visibile sia i metadati di provenienza contrassegnano il turno come dati
tra sessioni.

Durante la ricostruzione del contesto, OpenClaw applica lo stesso marcatore ai turni utente
tra sessioni persistenti meno recenti che dispongono solo dei metadati di provenienza.

---

## Matrice dei provider (comportamento attuale)

**OpenAI / OpenAI Codex**

- Solo sanificazione delle immagini.
- Elimina le firme di ragionamento orfane (elementi di ragionamento autonomi senza un
  blocco di contenuto successivo) dalle trascrizioni OpenAI Responses/Codex ed elimina il
  ragionamento OpenAI riproducibile dopo un cambio di instradamento del modello.
- Mantiene i payload degli elementi di ragionamento riproducibili di OpenAI Responses, inclusi
  gli elementi cifrati con riepilogo vuoto, affinché la riproduzione manuale/WebSocket mantenga lo stato
  `rs_*` richiesto associato agli elementi di output dell'assistente.
- ChatGPT Codex Responses nativo mantiene la parità con il protocollo Codex riproducendo
  i precedenti payload di ragionamento/messaggio/funzione di Responses senza gli ID degli elementi
  precedenti, preservando al contempo il `prompt_cache_key` della sessione.
- La riproduzione della famiglia OpenAI Responses conserva le coppie canoniche
  `call_*|fc_*` di ragionamento dello stesso modello, ma normalizza in modo deterministico gli ID
  `call_id`/degli elementi delle chiamate di funzione non validi o troppo lunghi prima della conversione del payload pi-ai.
- La riparazione dell'associazione dei risultati degli strumenti può spostare output reali corrispondenti e sintetizzare
  output `aborted` in stile Codex per le chiamate agli strumenti mancanti.
- Nessuna convalida o riordinamento dei turni; nessuna rimozione delle firme dei pensieri.

**Chat Completions compatibili con OpenAI**

- I blocchi storici di pensiero/ragionamento dell'assistente vengono rimossi prima della riproduzione,
  affinché i server locali e i proxy compatibili con OpenAI non ricevano
  campi di ragionamento dei turni precedenti come `reasoning` o `reasoning_content`.
- Le prosecuzioni delle chiamate agli strumenti nello stesso turno corrente mantengono il blocco di ragionamento
  dell'assistente associato alla chiamata dello strumento finché il risultato dello strumento non è stato riprodotto.
- Le voci dei modelli personalizzati/self-hosted con `reasoning: true` conservano i metadati
  di ragionamento riprodotti.
- Le eccezioni di proprietà del provider possono disattivare questo comportamento quando il relativo protocollo richiede
  i metadati di ragionamento riprodotti.

**Google (Generative AI / Gemini CLI / Antigravity)**

- Sanificazione degli ID delle chiamate agli strumenti: solo caratteri alfanumerici.
- Riparazione dell'associazione dei risultati degli strumenti e risultati sintetici degli strumenti.
- Convalida dei turni (alternanza dei turni in stile Gemini).
- Correzione dell'ordinamento dei turni Google (antepone un piccolo messaggio utente di inizializzazione se la cronologia
  inizia con l'assistente).
- Antigravity Claude: normalizza le firme di ragionamento; elimina i blocchi di ragionamento
  senza firma.

**Anthropic / Minimax (compatibili con Anthropic)**

- Riparazione dell'associazione dei risultati degli strumenti e risultati sintetici degli strumenti.
- Convalida dei turni (unisce turni utente consecutivi per rispettare la rigida
  alternanza).
- I turni finali di prefill dell'assistente vengono rimossi dai payload Anthropic Messages
  in uscita quando il ragionamento è abilitato, incluse le route Cloudflare AI
  Gateway.
- Le firme di ragionamento dell'assistente precedenti alla Compaction vengono rimosse prima della
  riproduzione per il provider quando una sessione è stata sottoposta a Compaction. Le firme di ragionamento sono
  vincolate crittograficamente al prefisso della conversazione al momento della generazione;
  dopo la Compaction il prefisso cambia (il contenuto riepilogato sostituisce
  l'originale), pertanto la riproduzione delle firme originali induce Anthropic a
  rifiutare la richiesta con "Invalid signature in thinking block". Il
  testo del ragionamento viene conservato come blocco senza firma e quindi gestito dalla
  regola seguente.
- I blocchi di ragionamento con firme di riproduzione mancanti, vuote o contenenti solo spazi vengono
  rimossi prima della conversione per il provider. Se ciò rende vuoto un turno dell'assistente,
  OpenClaw mantiene la struttura del turno con testo non vuoto per il ragionamento omesso.
- I turni meno recenti dell'assistente contenenti solo ragionamento che devono essere rimossi vengono sostituiti
  con testo non vuoto per il ragionamento omesso, affinché gli adattatori del provider non eliminino
  il turno da riprodurre.

**Amazon Bedrock (Converse API)**

- I turni vuoti dell'assistente con errore di streaming vengono riparati con un blocco di testo di
  fallback non vuoto prima della riproduzione. Bedrock Converse rifiuta i messaggi dell'assistente
  con `content: []`, pertanto anche i turni persistenti dell'assistente con `stopReason:
"error"` e contenuto vuoto vengono riparati su disco prima del caricamento.
- I turni dell'assistente con errore di streaming contenenti solo blocchi di testo vuoti vengono eliminati dalla
  copia in memoria da riprodurre anziché riprodurre un blocco vuoto non valido.
- Le firme di ragionamento dell'assistente precedenti alla Compaction vengono rimosse prima della riproduzione tramite Converse
  quando una sessione è stata sottoposta a Compaction, per lo stesso motivo indicato sopra per
  Anthropic.
- I blocchi di ragionamento di Claude con firme di riproduzione mancanti, vuote o contenenti solo spazi
  vengono rimossi prima della riproduzione tramite Converse. Se ciò rende vuoto un turno dell'assistente,
  OpenClaw mantiene la struttura del turno con testo non vuoto per il ragionamento omesso.
- I turni meno recenti dell'assistente contenenti solo ragionamento che devono essere rimossi vengono sostituiti
  con testo non vuoto per il ragionamento omesso, affinché la riproduzione tramite Converse mantenga
  la rigida struttura dei turni.
- La riproduzione filtra i turni dell'assistente usati come mirror di recapito di OpenClaw e quelli inseriti
  dal Gateway.
- La sanificazione delle immagini viene applicata tramite la regola globale.

**Mistral (incluso il rilevamento basato sull'ID del modello)**

- Sanificazione degli ID delle chiamate agli strumenti: strict9 (alfanumerici, lunghezza 9).

**OpenRouter Gemini**

- Pulizia delle firme dei pensieri: rimuove i valori `thought_signature` non in base64
  (mantiene quelli in base64).

**OpenRouter Anthropic**

- I turni finali di prefill dell'assistente vengono rimossi dai payload verificati dei modelli Anthropic
  compatibili con OpenAI di OpenRouter quando il ragionamento è abilitato,
  in linea con il comportamento di riproduzione di Anthropic diretto e Cloudflare Anthropic.

**Tutto il resto**

- Solo sanificazione delle immagini.

---

## Comportamento storico (precedente alla versione 2026.1.22)

Prima della versione 2026.1.22, OpenClaw applicava più livelli di gestione
dell'integrità delle trascrizioni:

- Un'**estensione per la sanificazione delle trascrizioni** veniva eseguita a ogni costruzione del contesto e poteva:
  - Riparare l'associazione tra utilizzo e risultato degli strumenti.
  - Sanificare gli ID delle chiamate agli strumenti (inclusa una modalità non rigorosa che conservava
    `_`/`-`).
- L'esecutore effettuava inoltre una sanificazione specifica per provider, duplicando
  il lavoro.
- Ulteriori modifiche avvenivano al di fuori dei criteri del provider, inclusa
  la rimozione dei tag `<final>` dal testo dell'assistente prima della persistenza, l'eliminazione
  dei turni vuoti dell'assistente con errore e il troncamento del contenuto dell'assistente dopo le chiamate
  agli strumenti.

Questa complessità causava regressioni tra provider (in particolare
nell'associazione `call_id|fc_id` di `openai-responses`). La pulizia della versione 2026.1.22 ha rimosso
l'estensione, centralizzato la logica nell'esecutore e reso OpenAI **non modificabile**
a eccezione della sanificazione delle immagini.

## Contenuti correlati

- [Gestione delle sessioni](/it/concepts/session)
- [Potatura delle sessioni](/it/concepts/session-pruning)
