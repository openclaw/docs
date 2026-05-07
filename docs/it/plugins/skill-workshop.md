---
read_when:
    - Vuoi che gli agenti trasformino le correzioni o le procedure riutilizzabili in Skills dello spazio di lavoro
    - Stai configurando la memoria delle abilità procedurali
    - Stai eseguendo il debug del comportamento dello strumento `skill_workshop`
    - Stai decidendo se abilitare la creazione automatica di Skills
summary: Acquisizione sperimentale di procedure riutilizzabili come Skills dell'area di lavoro con revisione, approvazione, quarantena e aggiornamento a caldo delle Skills
title: Plugin del workshop Skill
x-i18n:
    generated_at: "2026-05-07T13:24:17Z"
    model: gpt-5.5
    provider: openai
    source_hash: f7dc89644a1ac1d7400b8a03d7a132c1e836b3aca96e66018710945637d5c393
    source_path: plugins/skill-workshop.md
    workflow: 16
---

Skill Workshop è **sperimentale**. È disabilitato per impostazione predefinita, le sue euristiche di acquisizione e i prompt del revisore possono cambiare tra una release e l'altra, e le scritture automatiche dovrebbero essere usate solo in workspace attendibili dopo aver esaminato prima l'output in modalità pending.

Skill Workshop è memoria procedurale per le Skills del workspace. Consente a un agente di trasformare workflow riutilizzabili, correzioni dell'utente, fix ottenuti con fatica e insidie ricorrenti in file `SKILL.md` sotto:

```text
<workspace>/skills/<skill-name>/SKILL.md
```

Questo è diverso dalla memoria a lungo termine:

- **Memoria** archivia fatti, preferenze, entità e contesto passato.
- **Skills** archivia procedure riutilizzabili che l'agente dovrebbe seguire nelle attività future.
- **Skill Workshop** è il ponte tra un turno utile e una Skill durevole del workspace, con controlli di sicurezza e approvazione opzionale.

Skill Workshop è utile quando l'agente apprende una procedura come:

- come validare asset GIF animati provenienti da fonti esterne
- come sostituire asset di screenshot e verificare le dimensioni
- come eseguire uno scenario QA specifico del repository
- come eseguire il debug di un errore ricorrente di un provider
- come riparare una nota di workflow locale obsoleta

Non è pensato per:

- fatti come "all'utente piace il blu"
- memoria autobiografica ampia
- archiviazione grezza delle trascrizioni
- segreti, credenziali o testo di prompt nascosto
- istruzioni una tantum che non si ripeteranno

## Stato predefinito

Il plugin incluso è **sperimentale** e **disabilitato per impostazione predefinita** a meno che non venga abilitato esplicitamente in `plugins.entries.skill-workshop`.

Il manifest del plugin non imposta `enabledByDefault: true`. Il valore predefinito `enabled: true` all'interno dello schema di configurazione del plugin si applica solo dopo che la voce del plugin è già stata selezionata e caricata.

Sperimentale significa:

- il plugin è supportato a sufficienza per test opt-in e dogfooding
- l'archiviazione delle proposte, le soglie del revisore e le euristiche di acquisizione possono evolvere
- l'approvazione pending è la modalità iniziale consigliata
- l'applicazione automatica è destinata a configurazioni personali/workspace attendibili, non ad ambienti condivisi o ostili con molti input

## Abilitare

Configurazione minima sicura:

```json5
{
  plugins: {
    entries: {
      "skill-workshop": {
        enabled: true,
        config: {
          autoCapture: true,
          approvalPolicy: "pending",
          reviewMode: "hybrid",
        },
      },
    },
  },
}
```

Con questa configurazione:

- lo strumento `skill_workshop` è disponibile
- le correzioni riutilizzabili esplicite vengono accodate come proposte pending
- i passaggi del revisore basati su soglie possono proporre aggiornamenti delle Skills
- nessun file Skill viene scritto finché una proposta pending non viene applicata

Usa le scritture automatiche solo in workspace attendibili:

```json5
{
  plugins: {
    entries: {
      "skill-workshop": {
        enabled: true,
        config: {
          autoCapture: true,
          approvalPolicy: "auto",
          reviewMode: "hybrid",
        },
      },
    },
  },
}
```

`approvalPolicy: "auto"` usa comunque lo stesso scanner e lo stesso percorso di quarantena. Non applica proposte con rilievi critici.

## Configurazione

| Chiave               | Predefinito | Intervallo / valori                        | Significato                                                          |
| -------------------- | ----------- | ------------------------------------------ | -------------------------------------------------------------------- |
| `enabled`            | `true`      | boolean                                    | Abilita il plugin dopo il caricamento della voce del plugin.         |
| `autoCapture`        | `true`      | boolean                                    | Abilita acquisizione/revisione post-turno sui turni agente riusciti. |
| `approvalPolicy`     | `"pending"` | `"pending"`, `"auto"`                      | Accoda le proposte o scrive automaticamente le proposte sicure.      |
| `reviewMode`         | `"hybrid"`  | `"off"`, `"heuristic"`, `"llm"`, `"hybrid"` | Sceglie acquisizione di correzioni esplicite, revisore LLM, entrambi o nessuno. |
| `reviewInterval`     | `15`        | `1..200`                                   | Esegue il revisore dopo questo numero di turni riusciti.             |
| `reviewMinToolCalls` | `8`         | `1..500`                                   | Esegue il revisore dopo questo numero di chiamate a strumenti osservate. |
| `reviewTimeoutMs`    | `45000`     | `5000..180000`                             | Timeout per l'esecuzione del revisore incorporato.                   |
| `maxPending`         | `50`        | `1..200`                                   | Numero massimo di proposte pending/in quarantena conservate per workspace. |
| `maxSkillBytes`      | `40000`     | `1024..200000`                             | Dimensione massima dei file Skill/supporto generati.                 |

Profili consigliati:

```json5
// Conservative: explicit tool use only, no automatic capture.
{
  autoCapture: false,
  approvalPolicy: "pending",
  reviewMode: "off",
}
```

```json5
// Review-first: capture automatically, but require approval.
{
  autoCapture: true,
  approvalPolicy: "pending",
  reviewMode: "hybrid",
}
```

```json5
// Trusted automation: write safe proposals immediately.
{
  autoCapture: true,
  approvalPolicy: "auto",
  reviewMode: "hybrid",
}
```

```json5
// Low-cost: no reviewer LLM call, only explicit correction phrases.
{
  autoCapture: true,
  approvalPolicy: "pending",
  reviewMode: "heuristic",
}
```

## Percorsi di acquisizione

Skill Workshop ha tre percorsi di acquisizione.

### Suggerimenti degli strumenti

Il modello può chiamare direttamente `skill_workshop` quando vede una procedura riutilizzabile o quando l'utente gli chiede di salvare/aggiornare una Skill.

Questo è il percorso più esplicito e funziona anche con `autoCapture: false`.

### Acquisizione euristica

Quando `autoCapture` è abilitato e `reviewMode` è `heuristic` o `hybrid`, il plugin scansiona i turni riusciti alla ricerca di frasi esplicite di correzione dell'utente:

- `next time`
- `from now on`
- `remember to`
- `make sure to`
- `always ... use/check/verify/record/save/prefer`
- `prefer ... when/for/instead/use`
- `when asked`

L'euristica crea una proposta dall'ultima istruzione utente corrispondente. Usa suggerimenti di argomento per scegliere nomi di Skills per workflow comuni:

- attività con GIF animate -> `animated-gif-workflow`
- attività con screenshot o asset -> `screenshot-asset-workflow`
- attività QA o di scenario -> `qa-scenario-workflow`
- attività PR GitHub -> `github-pr-workflow`
- fallback -> `learned-workflows`

L'acquisizione euristica è intenzionalmente ristretta. È pensata per correzioni chiare e note di processo ripetibili, non per la sintesi generale delle trascrizioni.

### Revisore LLM

Quando `autoCapture` è abilitato e `reviewMode` è `llm` o `hybrid`, il plugin esegue un revisore incorporato compatto dopo il raggiungimento delle soglie.

Il revisore riceve:

- il testo della trascrizione recente, limitato agli ultimi 12.000 caratteri
- fino a 12 Skills del workspace esistenti
- fino a 2.000 caratteri da ciascuna Skill esistente
- istruzioni solo JSON

Il revisore non ha strumenti:

- `disableTools: true`
- `toolsAllow: []`
- `disableMessageTool: true`

Il revisore restituisce `{ "action": "none" }` oppure una proposta. Il campo `action` è `create`, `append` o `replace` - preferisci `append`/`replace` quando esiste già una Skill pertinente; usa `create` solo quando nessuna Skill esistente è adatta.

Esempio `create`:

```json
{
  "action": "create",
  "skillName": "media-asset-qa",
  "title": "Media Asset QA",
  "reason": "Reusable animated media acceptance workflow",
  "description": "Validate externally sourced animated media before product use.",
  "body": "## Workflow\n\n- Verify true animation.\n- Record attribution.\n- Store a local approved copy.\n- Verify in product UI before final reply."
}
```

`append` aggiunge `section` + `body`. `replace` sostituisce `oldText` con `newText` nella Skill indicata.

## Ciclo di vita delle proposte

Ogni aggiornamento generato diventa una proposta con:

- `id`
- `createdAt`
- `updatedAt`
- `workspaceDir`
- `agentId` opzionale
- `sessionId` opzionale
- `skillName`
- `title`
- `reason`
- `source`: `tool`, `agent_end` o `reviewer`
- `status`
- `change`
- `scanFindings` opzionale
- `quarantineReason` opzionale

Stati delle proposte:

- `pending` - in attesa di approvazione
- `applied` - scritto in `<workspace>/skills`
- `rejected` - rifiutato dall'operatore/modello
- `quarantined` - bloccato da rilievi critici dello scanner

Lo stato viene archiviato per ogni area di lavoro nella directory di stato del Gateway:

```text
<stateDir>/skill-workshop/<workspace-hash>.json
```

Le proposte in sospeso e in quarantena vengono deduplicate per nome della skill e payload
della modifica. L'archivio conserva le proposte in sospeso/in quarantena più recenti fino a
`maxPending`.

## Riferimento dello strumento

Il Plugin registra uno strumento agente:

```text
skill_workshop
```

### `status`

Conta le proposte per stato per l'area di lavoro attiva.

```json
{ "action": "status" }
```

Forma del risultato:

```json
{
  "workspaceDir": "/path/to/workspace",
  "pending": 1,
  "quarantined": 0,
  "applied": 3,
  "rejected": 0
}
```

### `list_pending`

Elenca le proposte in sospeso.

```json
{ "action": "list_pending" }
```

Per elencare un altro stato:

```json
{ "action": "list_pending", "status": "applied" }
```

Valori `status` validi:

- `pending`
- `applied`
- `rejected`
- `quarantined`

### `list_quarantine`

Elenca le proposte in quarantena.

```json
{ "action": "list_quarantine" }
```

Usalo quando l'acquisizione automatica sembra non fare nulla e i log menzionano
`skill-workshop: quarantined <skill>`.

### `inspect`

Recupera una proposta per id.

```json
{
  "action": "inspect",
  "id": "proposal-id"
}
```

### `suggest`

Crea una proposta. Con `approvalPolicy: "pending"` (predefinito), questa viene messa in coda invece di essere scritta.

```json
{
  "action": "suggest",
  "skillName": "animated-gif-workflow",
  "title": "Animated GIF Workflow",
  "reason": "User established reusable GIF validation rules.",
  "description": "Validate animated GIF assets before using them.",
  "body": "## Workflow\n\n- Verify the URL resolves to image/gif.\n- Confirm it has multiple frames.\n- Record attribution and license.\n- Avoid hotlinking when a local asset is needed."
}
```

<AccordionGroup>
  <Accordion title="Richiedi scrittura immediata in modalità automatica (apply: true)">

```json
{
  "action": "suggest",
  "apply": true,
  "skillName": "animated-gif-workflow",
  "description": "Validate animated GIF assets before using them.",
  "body": "## Workflow\n\n- Verify true animation.\n- Record attribution."
}
```

Con `approvalPolicy: "pending"`, `apply: true` mette comunque in coda la proposta. Esaminala, poi usa
l'azione `apply` dopo l'approvazione.

  </Accordion>

  <Accordion title="Forza in sospeso con criterio automatico (apply: false)">

```json
{
  "action": "suggest",
  "apply": false,
  "skillName": "screenshot-asset-workflow",
  "description": "Screenshot replacement workflow.",
  "body": "## Workflow\n\n- Verify dimensions.\n- Optimize the PNG.\n- Run the relevant gate."
}
```

  </Accordion>

  <Accordion title="Aggiungi a una sezione denominata">

```json
{
  "action": "suggest",
  "skillName": "qa-scenario-workflow",
  "section": "Workflow",
  "description": "QA scenario workflow.",
  "body": "- For media QA, verify generated assets render and pass final assertions."
}
```

  </Accordion>

  <Accordion title="Sostituisci testo esatto">

```json
{
  "action": "suggest",
  "skillName": "github-pr-workflow",
  "oldText": "- Check the PR.",
  "newText": "- Check unresolved review threads, CI status, linked issues, and changed files before deciding."
}
```

  </Accordion>
</AccordionGroup>

### `apply`

Applica una proposta in sospeso.

Con `approvalPolicy: "pending"`, questa azione chiede l'approvazione dell'operatore prima di scrivere la
skill dell'area di lavoro.

```json
{
  "action": "apply",
  "id": "proposal-id"
}
```

`apply` rifiuta le proposte in quarantena:

```text
quarantined proposal cannot be applied
```

### `reject`

Contrassegna una proposta come rifiutata.

```json
{
  "action": "reject",
  "id": "proposal-id"
}
```

### `write_support_file`

Scrive un file di supporto all'interno di una directory di skill esistente o proposta.

Directory di supporto di primo livello consentite:

- `references/`
- `templates/`
- `scripts/`
- `assets/`

Esempio:

```json
{
  "action": "write_support_file",
  "skillName": "release-workflow",
  "relativePath": "references/checklist.md",
  "body": "# Release Checklist\n\n- Run release docs.\n- Verify changelog.\n"
}
```

I file di supporto hanno ambito workspace, sono controllati in base al percorso, limitati in byte da
`maxSkillBytes`, scansionati e scritti atomicamente.

## Scritture Skill

Skill Workshop scrive solo sotto:

```text
<workspace>/skills/<normalized-skill-name>/
```

I nomi delle skill sono normalizzati:

- convertiti in minuscolo
- le sequenze non `[a-z0-9_-]` diventano `-`
- i caratteri non alfanumerici iniziali/finali vengono rimossi
- la lunghezza massima è 80 caratteri
- il nome finale deve corrispondere a `[a-z0-9][a-z0-9_-]{1,79}`

Per `create`:

- se la skill non esiste, Skill Workshop scrive un nuovo `SKILL.md`
- se esiste già, Skill Workshop aggiunge il corpo a `## Workflow`

Per `append`:

- se la skill esiste, Skill Workshop aggiunge alla sezione richiesta
- se non esiste, Skill Workshop crea una skill minima e poi aggiunge

Per `replace`:

- la skill deve esistere già
- `oldText` deve essere presente esattamente
- viene sostituita solo la prima corrispondenza esatta

Tutte le scritture sono atomiche e aggiornano immediatamente lo snapshot delle skills in memoria, così
la skill nuova o aggiornata può diventare visibile senza riavviare il Gateway.

## Modello di sicurezza

Skill Workshop ha uno scanner di sicurezza sul contenuto generato di `SKILL.md` e sui file di supporto.

I risultati critici mettono le proposte in quarantena:

| ID regola                              | Blocca contenuto che...                                             |
| -------------------------------------- | ------------------------------------------------------------------- |
| `prompt-injection-ignore-instructions` | dice all’agente di ignorare istruzioni precedenti/superiori         |
| `prompt-injection-system`              | fa riferimento a prompt di sistema, messaggi developer o istruzioni nascoste |
| `prompt-injection-tool`                | incoraggia ad aggirare permessi/approvazioni degli strumenti        |
| `shell-pipe-to-shell`                  | include `curl`/`wget` convogliati in `sh`, `bash` o `zsh`           |
| `secret-exfiltration`                  | sembra inviare dati env/process env sulla rete                      |

I risultati di avviso vengono conservati ma non bloccano da soli:

| ID regola            | Avvisa su...                         |
| -------------------- | ------------------------------------ |
| `destructive-delete` | comandi ampi in stile `rm -rf`       |
| `unsafe-permissions` | uso di permessi in stile `chmod 777` |

Le proposte in quarantena:

- conservano `scanFindings`
- conservano `quarantineReason`
- compaiono in `list_quarantine`
- non possono essere applicate tramite `apply`

Per recuperare da una proposta in quarantena, crea una nuova proposta sicura con il
contenuto non sicuro rimosso. Non modificare manualmente il JSON dello store.

## Guida ai prompt

Quando abilitato, Skill Workshop inserisce una breve sezione di prompt che dice all’agente
di usare `skill_workshop` per la memoria procedurale durevole.

La guida enfatizza:

- procedure, non fatti/preferenze
- correzioni dell’utente
- procedure riuscite non ovvie
- insidie ricorrenti
- riparazione di skill obsolete/sottili/errate tramite append/replace
- salvataggio di procedure riutilizzabili dopo lunghi cicli di strumenti o correzioni difficili
- testo skill breve e imperativo
- nessun dump di trascrizioni

Il testo della modalità di scrittura cambia con `approvalPolicy`:

- modalità pending: accoda suggerimenti; usa `apply` dopo approvazione esplicita
- modalità auto: applica aggiornamenti sicuri delle skill del workspace, a meno che `apply: false` non li accodi invece

## Costi e comportamento runtime

L’acquisizione euristica non chiama un modello.

La revisione LLM usa un’esecuzione incorporata sul modello dell’agente attivo/predefinito. È
basata su soglie, quindi per impostazione predefinita non viene eseguita a ogni turno.

Il revisore:

- usa lo stesso contesto provider/modello configurato quando disponibile
- ripiega sui valori predefiniti dell’agente runtime
- ha `reviewTimeoutMs`
- usa un contesto bootstrap leggero
- non ha strumenti
- non scrive nulla direttamente
- può solo emettere una proposta che passa attraverso il normale scanner e
  il percorso di approvazione/quarantena

Se il revisore fallisce, va in timeout o restituisce JSON non valido, il plugin registra un
messaggio warning/debug e salta quel passaggio di revisione.

## Schemi operativi

Usa Skill Workshop quando l’utente dice:

- "next time, do X"
- "from now on, prefer Y"
- "make sure to verify Z"
- "save this as a workflow"
- "this took a while; remember the process"
- "update the local skill for this"

Buon testo skill:

```markdown
## Workflow

- Verify the GIF URL resolves to `image/gif`.
- Confirm the file has multiple frames.
- Record source URL, license, and attribution.
- Store a local copy when the asset will ship with the product.
- Verify the local asset renders in the target UI before final reply.
```

Testo skill scarso:

```markdown
The user asked about a GIF and I searched two websites. Then one was blocked by
Cloudflare. The final answer said to check attribution.
```

Motivi per cui la versione scarsa non dovrebbe essere salvata:

- ha forma di trascrizione
- non è imperativa
- include dettagli rumorosi e una tantum
- non dice al prossimo agente cosa fare

## Debug

Controlla se il plugin è caricato:

```bash
openclaw plugins list --enabled
```

Controlla il conteggio delle proposte da un contesto agente/strumento:

```json
{ "action": "status" }
```

Ispeziona le proposte in sospeso:

```json
{ "action": "list_pending" }
```

Ispeziona le proposte in quarantena:

```json
{ "action": "list_quarantine" }
```

Sintomi comuni:

| Sintomo                               | Causa probabile                                                                     | Controllo                                                            |
| ------------------------------------- | ----------------------------------------------------------------------------------- | -------------------------------------------------------------------- |
| Lo strumento non è disponibile        | La voce Plugin non è abilitata                                                      | `plugins.entries.skill-workshop.enabled` e `openclaw plugins list`   |
| Non compare alcuna proposta automatica | `autoCapture: false`, `reviewMode: "off"` o soglie non soddisfatte                 | Configurazione, stato proposte, log del Gateway                      |
| L’euristica non ha acquisito          | La formulazione dell’utente non corrispondeva ai pattern di correzione              | Usa esplicitamente `skill_workshop.suggest` o abilita il revisore LLM |
| Il revisore non ha creato una proposta | Il revisore ha restituito `none`, JSON non valido o è andato in timeout             | Log del Gateway, `reviewTimeoutMs`, soglie                           |
| La proposta non viene applicata       | `approvalPolicy: "pending"`                                                         | `list_pending`, poi `apply`                                          |
| La proposta è sparita dai pending     | Proposta duplicata riutilizzata, potatura max pending, oppure applicata/rifiutata/messa in quarantena | `status`, `list_pending` con filtri di stato, `list_quarantine`      |
| Il file skill esiste ma il modello lo manca | Lo snapshot della skill non è aggiornato o il gating della skill la esclude     | stato `openclaw skills` e idoneità delle skill del workspace         |

Log rilevanti:

- `skill-workshop: queued <skill>`
- `skill-workshop: applied <skill>`
- `skill-workshop: quarantined <skill>`
- `skill-workshop: heuristic capture skipped: ...`
- `skill-workshop: reviewer skipped: ...`
- `skill-workshop: reviewer found no update`

## Scenari QA

Scenari QA basati sul repo:

- `qa/scenarios/plugins/skill-workshop-animated-gif-autocreate.md`
- `qa/scenarios/plugins/skill-workshop-pending-approval.md`
- `qa/scenarios/plugins/skill-workshop-reviewer-autonomous.md`

Esegui la copertura deterministica:

```bash
pnpm openclaw qa suite \
  --scenario skill-workshop-animated-gif-autocreate \
  --scenario skill-workshop-pending-approval \
  --concurrency 1
```

Esegui la copertura del revisore:

```bash
pnpm openclaw qa suite \
  --scenario skill-workshop-reviewer-autonomous \
  --concurrency 1
```

Lo scenario del revisore è intenzionalmente separato perché abilita
`reviewMode: "llm"` ed esercita il passaggio del revisore incorporato.

## Quando non abilitare l’applicazione automatica

Evita `approvalPolicy: "auto"` quando:

- il workspace contiene procedure sensibili
- l’agente sta lavorando su input non attendibile
- le skills sono condivise in un team ampio
- stai ancora regolando prompt o regole dello scanner
- il modello gestisce spesso contenuti web/email ostili

Usa prima la modalità pending. Passa alla modalità auto solo dopo aver esaminato il tipo di
skills che l’agente propone in quel workspace.

## Documentazione correlata

- [Skills](/it/tools/skills)
- [Plugins](/it/tools/plugin)
- [Testing](/it/reference/test)
