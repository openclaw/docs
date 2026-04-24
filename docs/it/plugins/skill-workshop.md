---
read_when:
    - Vuoi che gli agenti trasformino correzioni o procedure riutilizzabili in Skills del workspace
    - Stai configurando la memoria procedurale delle Skills
    - Stai eseguendo il debug del comportamento dello strumento skill_workshop
    - Stai decidendo se abilitare la creazione automatica delle Skills
summary: Acquisizione sperimentale di procedure riutilizzabili come Skills del workspace con revisione, approvazione, quarantena e aggiornamento a caldo delle skill
title: Plugin Skill workshop
x-i18n:
    generated_at: "2026-04-24T08:54:53Z"
    model: gpt-5.4
    provider: openai
    source_hash: e6063843bf15e639d7f5943db1bab52fbffce6ec30af350221d8b3cd711e227b
    source_path: plugins/skill-workshop.md
    workflow: 15
---

Skill Workshop è **sperimentale**. È disabilitato per impostazione predefinita, le sue euristiche di acquisizione
e i prompt del revisore possono cambiare tra una release e l'altra, e le scritture automatiche
dovrebbero essere usate solo in workspace attendibili dopo aver prima esaminato l'output in modalità pending.

Skill Workshop è memoria procedurale per le Skills del workspace. Permette a un agente di trasformare
workflow riutilizzabili, correzioni dell'utente, correzioni difficilmente conquistate e ricorrenze problematiche in file `SKILL.md` sotto:

```text
<workspace>/skills/<skill-name>/SKILL.md
```

Questo è diverso dalla memoria a lungo termine:

- **Memory** memorizza fatti, preferenze, entità e contesto passato.
- **Skills** memorizzano procedure riutilizzabili che l'agente dovrebbe seguire in attività future.
- **Skill Workshop** è il ponte da un turno utile a una Skill durevole del workspace, con controlli di sicurezza e approvazione facoltativa.

Skill Workshop è utile quando l'agente apprende una procedura come:

- come validare asset GIF animate provenienti da fonti esterne
- come sostituire asset screenshot e verificare le dimensioni
- come eseguire uno scenario QA specifico del repo
- come eseguire il debug di un guasto ricorrente di un provider
- come riparare una nota di workflow locale obsoleta

Non è pensato per:

- fatti come “all'utente piace il blu”
- memoria autobiografica ampia
- archiviazione grezza delle trascrizioni
- segreti, credenziali o testo nascosto del prompt
- istruzioni una tantum che non si ripeteranno

## Stato predefinito

Il Plugin incluso è **sperimentale** e **disabilitato per impostazione predefinita** a meno che non venga
esplicitamente abilitato in `plugins.entries.skill-workshop`.

Il manifest del Plugin non imposta `enabledByDefault: true`. Il valore predefinito `enabled: true`
all'interno dello schema di configurazione del Plugin si applica solo dopo che la voce del Plugin è già stata selezionata e caricata.

Sperimentale significa:

- il Plugin è abbastanza supportato per test opt-in e dogfooding
- l'archiviazione delle proposte, le soglie del revisore e le euristiche di acquisizione possono evolvere
- l'approvazione pending è il modo consigliato da cui iniziare
- l'applicazione automatica è per configurazioni personali/del workspace attendibili, non per ambienti condivisi o ostili ricchi di input

## Abilitazione

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
- i passaggi del revisore basati su soglia possono proporre aggiornamenti alle Skill
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

`approvalPolicy: "auto"` usa comunque lo stesso scanner e lo stesso percorso di quarantena. Non
applica le proposte con risultati critici.

## Configurazione

| Chiave               | Predefinito | Intervallo / valori                           | Significato                                                           |
| -------------------- | ----------- | --------------------------------------------- | --------------------------------------------------------------------- |
| `enabled`            | `true`      | boolean                                       | Abilita il Plugin dopo che la voce del Plugin è stata caricata.       |
| `autoCapture`        | `true`      | boolean                                       | Abilita acquisizione/revisione post-turno sui turni agente riusciti.  |
| `approvalPolicy`     | `"pending"` | `"pending"`, `"auto"`                         | Accoda le proposte o scrive automaticamente quelle sicure.            |
| `reviewMode`         | `"hybrid"`  | `"off"`, `"heuristic"`, `"llm"`, `"hybrid"`   | Sceglie acquisizione di correzioni esplicite, revisore LLM, entrambi o nessuno. |
| `reviewInterval`     | `15`        | `1..200`                                      | Esegue il revisore dopo questo numero di turni riusciti.              |
| `reviewMinToolCalls` | `8`         | `1..500`                                      | Esegue il revisore dopo questo numero di chiamate di tool osservate.  |
| `reviewTimeoutMs`    | `45000`     | `5000..180000`                                | Timeout per l'esecuzione del revisore embedded.                       |
| `maxPending`         | `50`        | `1..200`                                      | Numero massimo di proposte pending/in quarantena conservate per workspace. |
| `maxSkillBytes`      | `40000`     | `1024..200000`                                | Dimensione massima della Skill generata/file di supporto.             |

Profili consigliati:

```json5
// Conservativo: solo uso esplicito dello strumento, nessuna acquisizione automatica.
{
  autoCapture: false,
  approvalPolicy: "pending",
  reviewMode: "off",
}
```

```json5
// Prima la revisione: acquisizione automatica, ma con approvazione obbligatoria.
{
  autoCapture: true,
  approvalPolicy: "pending",
  reviewMode: "hybrid",
}
```

```json5
// Automazione attendibile: scrive subito le proposte sicure.
{
  autoCapture: true,
  approvalPolicy: "auto",
  reviewMode: "hybrid",
}
```

```json5
// Basso costo: nessuna chiamata LLM al revisore, solo frasi di correzione esplicite.
{
  autoCapture: true,
  approvalPolicy: "pending",
  reviewMode: "heuristic",
}
```

## Percorsi di acquisizione

Skill Workshop ha tre percorsi di acquisizione.

### Suggerimenti dello strumento

Il modello può chiamare direttamente `skill_workshop` quando vede una procedura riutilizzabile
o quando l'utente gli chiede di salvare/aggiornare una Skill.

Questo è il percorso più esplicito e funziona anche con `autoCapture: false`.

### Acquisizione euristica

Quando `autoCapture` è abilitato e `reviewMode` è `heuristic` o `hybrid`, il
Plugin analizza i turni riusciti alla ricerca di frasi esplicite di correzione dell'utente:

- `next time`
- `from now on`
- `remember to`
- `make sure to`
- `always ... use/check/verify/record/save/prefer`
- `prefer ... when/for/instead/use`
- `when asked`

L'euristica crea una proposta a partire dall'ultima istruzione utente corrispondente. Usa suggerimenti per argomento per scegliere i nomi delle Skill per workflow comuni:

- attività con GIF animate -> `animated-gif-workflow`
- attività con screenshot o asset -> `screenshot-asset-workflow`
- attività QA o scenari -> `qa-scenario-workflow`
- attività GitHub PR -> `github-pr-workflow`
- fallback -> `learned-workflows`

L'acquisizione euristica è intenzionalmente ristretta. Serve per correzioni chiare e note di processo ripetibili, non per il riepilogo generale delle trascrizioni.

### Revisore LLM

Quando `autoCapture` è abilitato e `reviewMode` è `llm` o `hybrid`, il Plugin
esegue un revisore embedded compatto al raggiungimento delle soglie.

Il revisore riceve:

- il testo della trascrizione recente, limitato agli ultimi 12.000 caratteri
- fino a 12 Skills esistenti del workspace
- fino a 2.000 caratteri da ogni Skill esistente
- istruzioni solo JSON

Il revisore non ha strumenti:

- `disableTools: true`
- `toolsAllow: []`
- `disableMessageTool: true`

Il revisore restituisce `{ "action": "none" }` oppure una proposta. Il campo `action` è `create`, `append` o `replace` — preferisci `append`/`replace` quando esiste già una Skill rilevante; usa `create` solo quando nessuna Skill esistente è adatta.

Esempio di `create`:

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

`append` aggiunge `section` + `body`. `replace` sostituisce `oldText` con `newText` nella Skill nominata.

## Ciclo di vita della proposta

Ogni aggiornamento generato diventa una proposta con:

- `id`
- `createdAt`
- `updatedAt`
- `workspaceDir`
- facoltativamente `agentId`
- facoltativamente `sessionId`
- `skillName`
- `title`
- `reason`
- `source`: `tool`, `agent_end` o `reviewer`
- `status`
- `change`
- facoltativamente `scanFindings`
- facoltativamente `quarantineReason`

Stati della proposta:

- `pending` - in attesa di approvazione
- `applied` - scritta in `<workspace>/skills`
- `rejected` - rifiutata da operatore/modello
- `quarantined` - bloccata da risultati critici dello scanner

Lo stato viene memorizzato per workspace sotto la directory di stato del Gateway:

```text
<stateDir>/skill-workshop/<workspace-hash>.json
```

Le proposte pending e in quarantena vengono deduplicate in base al nome della Skill e al
payload della modifica. Il negozio conserva le proposte pending/in quarantena più recenti fino a
`maxPending`.

## Riferimento dello strumento

Il Plugin registra uno strumento agente:

```text
skill_workshop
```

### `status`

Conta le proposte per stato per il workspace attivo.

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

Elenca le proposte pending.

```json
{ "action": "list_pending" }
```

Per elencare un altro stato:

```json
{ "action": "list_pending", "status": "applied" }
```

Valori validi di `status`:

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

Recupera una proposta per ID.

```json
{
  "action": "inspect",
  "id": "proposal-id"
}
```

### `suggest`

Crea una proposta. Con `approvalPolicy: "pending"` (predefinito), questa viene accodata invece di essere scritta.

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
  <Accordion title="Forza una scrittura sicura (apply: true)">

```json
{
  "action": "suggest",
  "apply": true,
  "skillName": "animated-gif-workflow",
  "description": "Validate animated GIF assets before using them.",
  "body": "## Workflow\n\n- Verify true animation.\n- Record attribution."
}
```

  </Accordion>

  <Accordion title="Forza pending sotto criterio auto (apply: false)">

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

  <Accordion title="Aggiungi a una sezione nominata">

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

Applica una proposta pending.

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

Segna una proposta come rifiutata.

```json
{
  "action": "reject",
  "id": "proposal-id"
}
```

### `write_support_file`

Scrive un file di supporto dentro una directory Skill esistente o proposta.

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

I file di supporto hanno ambito workspace, sono controllati nel percorso, limitati in byte da
`maxSkillBytes`, sottoposti a scansione e scritti in modo atomico.

## Scritture delle Skill

Skill Workshop scrive solo sotto:

```text
<workspace>/skills/<normalized-skill-name>/
```

I nomi delle Skill vengono normalizzati:

- in minuscolo
- le sequenze non `[a-z0-9_-]` diventano `-`
- i caratteri non alfanumerici iniziali/finali vengono rimossi
- la lunghezza massima è 80 caratteri
- il nome finale deve corrispondere a `[a-z0-9][a-z0-9_-]{1,79}`

Per `create`:

- se la Skill non esiste, Skill Workshop scrive una nuova `SKILL.md`
- se esiste già, Skill Workshop aggiunge il body a `## Workflow`

Per `append`:

- se la Skill esiste, Skill Workshop aggiunge alla sezione richiesta
- se non esiste, Skill Workshop crea una Skill minima e poi aggiunge

Per `replace`:

- la Skill deve già esistere
- `oldText` deve essere presente esattamente
- viene sostituita solo la prima corrispondenza esatta

Tutte le scritture sono atomiche e aggiornano immediatamente lo snapshot in-memory delle Skills, così la Skill nuova o aggiornata può diventare visibile senza riavviare il Gateway.

## Modello di sicurezza

Skill Workshop ha uno scanner di sicurezza sul contenuto generato di `SKILL.md` e sui file di supporto.

I risultati critici mettono in quarantena le proposte:

| ID regola                              | Blocca contenuto che...                                                |
| -------------------------------------- | ---------------------------------------------------------------------- |
| `prompt-injection-ignore-instructions` | dice all'agente di ignorare istruzioni precedenti/superiori            |
| `prompt-injection-system`              | fa riferimento a prompt di sistema, messaggi developer o istruzioni nascoste |
| `prompt-injection-tool`                | incoraggia ad aggirare permessi/approvazioni degli strumenti           |
| `shell-pipe-to-shell`                  | include `curl`/`wget` pipe a `sh`, `bash` o `zsh`                      |
| `secret-exfiltration`                  | sembra inviare dati env/process env sulla rete                         |

I risultati warn vengono conservati ma non bloccano da soli:

| ID regola              | Segnala...                         |
| ---------------------- | ---------------------------------- |
| `destructive-delete`   | comandi ampi in stile `rm -rf`     |
| `unsafe-permissions`   | uso di permessi in stile `chmod 777` |

Le proposte in quarantena:

- mantengono `scanFindings`
- mantengono `quarantineReason`
- compaiono in `list_quarantine`
- non possono essere applicate tramite `apply`

Per recuperare da una proposta in quarantena, crea una nuova proposta sicura con il
contenuto non sicuro rimosso. Non modificare a mano il JSON del negozio.

## Guida del prompt

Quando abilitato, Skill Workshop inietta una breve sezione di prompt che dice all'agente
di usare `skill_workshop` per la memoria procedurale durevole.

La guida enfatizza:

- procedure, non fatti/preferenze
- correzioni dell'utente
- procedure riuscite non ovvie
- ricorrenza di problemi
- riparazione di Skills obsolete/sottili/sbagliate tramite append/replace
- salvataggio della procedura riutilizzabile dopo lunghi cicli di tool o correzioni difficili
- testo della Skill breve e imperativo
- niente dump di trascrizione

Il testo della modalità di scrittura cambia con `approvalPolicy`:

- modalità pending: accoda i suggerimenti; applica solo dopo approvazione esplicita
- modalità auto: applica aggiornamenti sicuri alle Skills del workspace quando sono chiaramente riutilizzabili

## Costi e comportamento runtime

L'acquisizione euristica non chiama alcun modello.

La revisione LLM usa un'esecuzione embedded sul modello attivo/predefinito dell'agente. È
basata su soglie, quindi per impostazione predefinita non viene eseguita a ogni turno.

Il revisore:

- usa lo stesso contesto provider/modello configurato quando disponibile
- ripiega sui valori predefiniti runtime dell'agente
- ha `reviewTimeoutMs`
- usa un contesto bootstrap leggero
- non ha strumenti
- non scrive nulla direttamente
- può emettere solo una proposta che passa attraverso il normale scanner e
  il percorso di approvazione/quarantena

Se il revisore fallisce, va in timeout o restituisce JSON non valido, il plugin registra un
messaggio warning/debug e salta quel passaggio di revisione.

## Modelli operativi

Usa Skill Workshop quando l'utente dice:

- “la prossima volta, fai X”
- “d'ora in poi, preferisci Y”
- “assicurati di verificare Z”
- “salva questo come workflow”
- “questo ha richiesto un po'; ricordati il processo”
- “aggiorna la skill locale per questo”

Buon testo di Skill:

```markdown
## Workflow

- Verify the GIF URL resolves to `image/gif`.
- Confirm the file has multiple frames.
- Record source URL, license, and attribution.
- Store a local copy when the asset will ship with the product.
- Verify the local asset renders in the target UI before final reply.
```

Testo di Skill scarso:

```markdown
The user asked about a GIF and I searched two websites. Then one was blocked by
Cloudflare. The final answer said to check attribution.
```

Motivi per cui la versione scarsa non dovrebbe essere salvata:

- ha forma da trascrizione
- non è imperativa
- include dettagli rumorosi e una tantum
- non dice all'agente successivo cosa fare

## Debugging

Controlla se il Plugin è caricato:

```bash
openclaw plugins list --enabled
```

Controlla il conteggio delle proposte dal contesto agente/strumento:

```json
{ "action": "status" }
```

Ispeziona le proposte pending:

```json
{ "action": "list_pending" }
```

Ispeziona le proposte in quarantena:

```json
{ "action": "list_quarantine" }
```

Sintomi comuni:

| Sintomo                              | Causa probabile                                                                      | Controllo                                                            |
| ------------------------------------ | ------------------------------------------------------------------------------------ | -------------------------------------------------------------------- |
| Lo strumento non è disponibile       | La voce del Plugin non è abilitata                                                   | `plugins.entries.skill-workshop.enabled` e `openclaw plugins list`   |
| Non compare alcuna proposta automatica | `autoCapture: false`, `reviewMode: "off"` oppure soglie non raggiunte              | Configurazione, stato delle proposte, log del Gateway                |
| L'euristica non ha acquisito         | Il testo dell'utente non corrispondeva ai pattern di correzione                     | Usa `skill_workshop.suggest` esplicito o abilita il revisore LLM     |
| Il revisore non ha creato una proposta | Il revisore ha restituito `none`, JSON non valido o è andato in timeout           | Log del Gateway, `reviewTimeoutMs`, soglie                           |
| La proposta non viene applicata      | `approvalPolicy: "pending"`                                                          | `list_pending`, poi `apply`                                          |
| La proposta è sparita dal pending    | Proposta duplicata riutilizzata, pruning del max pending o è stata applicata/rifiutata/messa in quarantena | `status`, `list_pending` con filtri di stato, `list_quarantine` |
| Il file Skill esiste ma il modello non lo vede | Lo snapshot delle Skill non è stato aggiornato o il gating delle skill lo esclude | Stato `openclaw skills` e idoneità delle skill del workspace         |

Log rilevanti:

- `skill-workshop: queued <skill>`
- `skill-workshop: applied <skill>`
- `skill-workshop: quarantined <skill>`
- `skill-workshop: heuristic capture skipped: ...`
- `skill-workshop: reviewer skipped: ...`
- `skill-workshop: reviewer found no update`

## Scenari QA

Scenari QA supportati dal repo:

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
`reviewMode: "llm"` ed esercita il passaggio del revisore embedded.

## Quando non abilitare l'applicazione automatica

Evita `approvalPolicy: "auto"` quando:

- il workspace contiene procedure sensibili
- l'agente lavora su input non attendibili
- le Skills sono condivise tra un team ampio
- stai ancora ottimizzando prompt o regole dello scanner
- il modello gestisce spesso contenuti web/email ostili

Usa prima la modalità pending. Passa alla modalità auto solo dopo aver esaminato il tipo di
Skills che l'agente propone in quel workspace.

## Documentazione correlata

- [Skills](/it/tools/skills)
- [Plugins](/it/tools/plugin)
- [Testing](/it/reference/test)
