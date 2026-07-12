---
read_when:
    - Configurazione del caricamento, dell'installazione o del comportamento di abilitazione delle Skills
    - Impostazione della visibilità delle Skills per agente
    - Modifica dei limiti di Skill Workshop o dei criteri di approvazione
sidebarTitle: Skills config
summary: Riferimento completo per lo schema di configurazione skills.*, gli elenchi di autorizzazione degli agenti, le impostazioni del workshop e la gestione delle variabili d'ambiente della sandbox.
title: Configurazione delle Skills
x-i18n:
    generated_at: "2026-07-12T07:38:37Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 0ed1ec20aa102b458a9485a1ada1bb7566c97d28b1f43caa28f52b3f5bdc381e
    source_path: tools/skills-config.md
    workflow: 16
---

La maggior parte della configurazione delle skill si trova in `skills` in
`~/.openclaw/openclaw.json`. La visibilità specifica per agente si trova in
`agents.defaults.skills` e `agents.list[].skills`.

```json5
{
  skills: {
    allowBundled: ["gemini", "peekaboo"],
    load: {
      extraDirs: ["~/Projects/agent-scripts/skills"],
      allowSymlinkTargets: ["~/Projects/manager/skills"],
      watch: true,
      watchDebounceMs: 250,
    },
    install: {
      preferBrew: true,
      nodeManager: "npm",
      allowUploadedArchives: false,
    },
    workshop: {
      autonomous: { enabled: false },
      allowSymlinkTargetWrites: false,
      approvalPolicy: "pending",
      maxPending: 50,
      maxSkillBytes: 40000,
    },
    entries: {
      "image-lab": {
        enabled: true,
        apiKey: { source: "env", provider: "default", id: "GEMINI_API_KEY" },
        env: { GEMINI_API_KEY: "GEMINI_KEY_HERE" },
      },
      peekaboo: { enabled: true },
      sag: { enabled: false },
    },
  },
}
```

<Note>
  Per la generazione di immagini integrata, usa `agents.defaults.imageGenerationModel`
  insieme allo strumento principale `image_generate` anziché `skills.entries`. Le voci
  delle skill servono esclusivamente per flussi di lavoro di skill personalizzati o di terze parti.
</Note>

## Caricamento (`skills.load`)

<ParamField path="skills.load.extraDirs" type="string[]">
  Directory aggiuntive delle skill da analizzare, con la priorità più bassa (dopo
  le skill incluse e dei Plugin). I percorsi vengono espansi con il supporto di `~`.
</ParamField>

<ParamField path="skills.load.allowSymlinkTargets" type="string[]">
  Directory di destinazione reali attendibili in cui possono risolversi le cartelle
  delle skill collegate simbolicamente, anche quando il collegamento simbolico si trova
  all'esterno della radice configurata. Usalo per strutture intenzionali con repository
  adiacenti, come `<workspace>/skills/manager -> ~/Projects/manager/skills`. Mantieni
  questo elenco ristretto: non indicare radici generiche come `~` o `~/Projects`.
</ParamField>

<ParamField path="skills.load.watch" type="boolean" default="true">
  Monitora le cartelle delle skill e aggiorna l'istantanea delle skill quando cambiano
  i file `SKILL.md`. Include i file annidati nelle radici raggruppate delle skill.
</ParamField>

<ParamField path="skills.load.watchDebounceMs" type="number" default="250">
  Finestra di debounce in millisecondi per gli eventi del monitoraggio delle skill.
</ParamField>

## Installazione (`skills.install`)

<ParamField path="skills.install.preferBrew" type="boolean" default="true">
  Preferisce i programmi di installazione Homebrew quando `brew` è disponibile.
</ParamField>

<ParamField path="skills.install.nodeManager" type='"npm" | "pnpm" | "yarn" | "bun"' default='"npm"'>
  Preferenza del gestore di pacchetti Node per le installazioni delle skill. Ciò influisce
  solo sulle installazioni delle skill: il runtime del Gateway deve continuare a usare Node
  (Bun non è consigliato per WhatsApp/Telegram). `openclaw setup --node-manager` e
  `openclaw onboard --node-manager` accettano `npm`, `pnpm` o `bun`; imposta
  `"yarn"` direttamente nella configurazione per installazioni delle skill basate su Yarn.
</ParamField>

<ParamField path="skills.install.allowUploadedArchives" type="boolean" default="false">
  Consente ai client Gateway `operator.admin` attendibili di installare archivi zip
  privati predisposti tramite `skills.upload.*`. Le normali installazioni da ClawHub non
  richiedono questa impostazione.
</ParamField>

## Criteri di installazione dell'operatore (`security.installPolicy`)

Usa `security.installPolicy` quando gli operatori necessitano di un comando locale
attendibile per approvare o bloccare le installazioni di skill e Plugin in base a criteri
specifici dell'host. Il criterio viene eseguito dopo che OpenClaw ha predisposto il materiale
sorgente e prima che l'installazione o l'aggiornamento prosegua. Si applica alle skill di
ClawHub, alle skill caricate, alle skill Git/locali, ai programmi di installazione delle
dipendenze delle skill e alle sorgenti di installazione/aggiornamento dei Plugin.

```json5
{
  security: {
    installPolicy: {
      enabled: true,
      // Omit targets to cover every supported target.
      targets: ["skill", "plugin"],
      exec: {
        source: "exec",
        command: "/usr/local/bin/openclaw-install-policy",
        args: ["--json"],
        timeoutMs: 10000,
        noOutputTimeoutMs: 10000,
        maxOutputBytes: 1048576,
        passEnv: ["OPENCLAW_STATE_DIR", "PATH"],
        env: { POLICY_MODE: "strict" },
        trustedDirs: ["/usr/local/bin"],
      },
    },
  },
}
```

<ParamField path="security.installPolicy.enabled" type="boolean" default="false">
  Abilita il criterio di installazione gestito dall'operatore. Quando è abilitato senza
  un comando `exec` valido, le installazioni vengono bloccate per impostazione predefinita.
</ParamField>

<ParamField path="security.installPolicy.targets" type='("skill" | "plugin")[]'>
  Filtro facoltativo delle destinazioni. Se omesso, il criterio si applica a tutte le
  destinazioni supportate, affinché le nuove installazioni non vengano inaspettatamente
  consentite per impostazione predefinita.
</ParamField>

<ParamField path="security.installPolicy.exec.command" type="string">
  Percorso assoluto dell'eseguibile attendibile del criterio. OpenClaw lo esegue senza
  una shell e convalida il percorso prima dell'uso.
</ParamField>

<ParamField path="security.installPolicy.exec.args" type="string[]">
  Argomenti statici passati dopo `command`.
</ParamField>

<ParamField path="security.installPolicy.exec.timeoutMs" type="number" default="10000">
  Durata massima effettiva per una singola decisione del criterio.
</ParamField>

<ParamField path="security.installPolicy.exec.noOutputTimeoutMs" type="number" default="timeoutMs">
  Tempo massimo senza output su stdout o stderr prima che il criterio blocchi
  l'operazione per impostazione predefinita.
</ParamField>

<ParamField path="security.installPolicy.exec.maxOutputBytes" type="number" default="1048576">
  Numero massimo complessivo di byte di stdout e stderr accettati dal processo del criterio.
</ParamField>

<ParamField path="security.installPolicy.exec.env" type="Record<string, string>">
  Variabili d'ambiente letterali fornite al processo del criterio.
</ParamField>

<ParamField path="security.installPolicy.exec.passEnv" type="string[]">
  Nomi delle variabili d'ambiente copiati dal processo OpenClaw nel processo del
  criterio. Vengono passate solo le variabili indicate.
</ParamField>

<ParamField path="security.installPolicy.exec.trustedDirs" type="string[]">
  Elenco consentito facoltativo delle directory che possono contenere l'eseguibile del criterio.
</ParamField>

<ParamField path="security.installPolicy.exec.allowInsecurePath" type="boolean" default="false">
  Ignora i controlli sulla proprietà e sui permessi del percorso del comando. Usalo solo
  quando il percorso è protetto da un altro meccanismo.
</ParamField>

<ParamField path="security.installPolicy.exec.allowSymlinkCommand" type="boolean" default="false">
  Consente che il percorso del comando configurato sia un collegamento simbolico. La
  destinazione risolta deve comunque soddisfare gli altri controlli sul percorso. Gli
  argomenti degli script dell'interprete devono essere file regolari diretti, non collegamenti simbolici.
</ParamField>

Il criterio riceve su stdin un oggetto JSON con `protocolVersion: 1`,
`openclawVersion`, `targetType`, `targetName`, `sourcePath`, `sourcePathKind`,
i campi strutturati facoltativi `source` e `origin`, e `request`. Deve
scrivere su stdout un oggetto JSON: `{ "protocolVersion": 1, "decision": "allow" }`
oppure `{ "protocolVersion": 1, "decision": "block", "reason": "..." }`. Un codice di
uscita diverso da zero, un timeout, JSON non valido, campi mancanti o versioni del
protocollo non supportate comportano il blocco per impostazione predefinita.

OpenClaw non esegue il criterio di installazione durante il normale avvio del Gateway.
Le installazioni e gli aggiornamenti vengono bloccati per impostazione predefinita quando
il criterio è abilitato ma non disponibile. `openclaw doctor` esegue la convalida statica;
`openclaw doctor --deep` esegue una verifica di installazione simulata sul comando configurato.

Gli aggiornamenti in blocco applicano il criterio a ogni destinazione: l'aggiornamento
bloccato di una skill o di un Plugin non riesce per quella destinazione, senza disabilitare
il criterio né saltare le destinazioni successive del gruppo.

Esempio di stdin:

```json
{
  "protocolVersion": 1,
  "openclawVersion": "2026.6.1",
  "targetType": "skill",
  "targetName": "weather",
  "sourcePath": "/var/folders/.../openclaw-skill-clawhub/root",
  "sourcePathKind": "directory",
  "source": {
    "kind": "clawhub",
    "authority": "openclaw",
    "mutable": false,
    "network": true
  },
  "origin": {
    "type": "clawhub",
    "registry": "https://clawhub.openclaw.ai",
    "slug": "weather",
    "version": "1.0.0"
  },
  "request": {
    "kind": "skill-install",
    "mode": "install",
    "requestedSpecifier": "clawhub:weather@1.0.0"
  },
  "skill": {
    "installId": "clawhub"
  }
}
```

Comando minimo del criterio:

```js
#!/usr/bin/env node

let input = "";
process.stdin.setEncoding("utf8");
process.stdin.on("data", (chunk) => {
  input += chunk;
});
process.stdin.on("end", () => {
  const request = JSON.parse(input);
  if (request.targetType === "plugin" && request.source?.kind === "local-path") {
    process.stdout.write(
      JSON.stringify({
        protocolVersion: 1,
        decision: "block",
        reason: "local plugin paths are not approved on this host",
      }),
    );
    return;
  }
  process.stdout.write(JSON.stringify({ protocolVersion: 1, decision: "allow" }));
});
```

## Elenco consentito delle skill incluse

<ParamField path="skills.allowBundled" type="string[]">
  Elenco consentito facoltativo esclusivamente per le skill **incluse**. Quando è impostato,
  sono idonee solo le skill incluse presenti nell'elenco. Le skill gestite, a livello di
  agente e dell'area di lavoro non sono interessate.
</ParamField>

## Voci per singola skill (`skills.entries`)

Per impostazione predefinita, le chiavi in `entries` corrispondono al `name` della skill.
Se una skill definisce `metadata.openclaw.skillKey`, usa invece tale chiave. Racchiudi tra
virgolette i nomi con trattini (JSON5 consente chiavi tra virgolette).

<ParamField path="skills.entries.<key>.enabled" type="boolean">
  `false` disabilita la skill anche se inclusa o installata. La skill inclusa
  `coding-agent` richiede l'abilitazione esplicita: impostala su `true` e assicurati che
  `claude`, `codex`, `opencode` o un'altra CLI supportata sia installata e autenticata.
</ParamField>

<ParamField path="skills.entries.<key>.apiKey" type='string | { source, provider, id }'>
  Campo di praticità per le skill che dichiarano `metadata.openclaw.primaryEnv`.
  Supporta una stringa in testo non crittografato o un SecretRef: `{ source: "env", provider: "default", id: "VAR_NAME" }`.
</ParamField>

<ParamField path="skills.entries.<key>.env" type="Record<string, string>">
  Variabili d'ambiente inserite per l'esecuzione dell'agente. Vengono inserite solo
  quando la variabile non è già impostata nel processo.
</ParamField>

<ParamField path="skills.entries.<key>.config" type="object">
  Contenitore facoltativo per campi di configurazione personalizzati per singola skill.
</ParamField>

## Elenchi consentiti degli agenti (`agents`)

Usa la configurazione dell'agente quando vuoi mantenere le stesse radici delle skill
della macchina/area di lavoro, ma un insieme di skill visibili diverso per ogni agente.

```json5
{
  agents: {
    defaults: {
      skills: ["github", "weather"], // shared baseline
    },
    list: [
      { id: "writer" }, // inherits github, weather
      { id: "docs", skills: ["docs-search"] }, // replaces defaults entirely
      { id: "locked-down", skills: [] }, // no skills
    ],
  },
}
```

<ParamField path="agents.defaults.skills" type="string[]">
  Elenco consentito di base condiviso, ereditato dagli agenti che omettono
  `agents.list[].skills`. Omettilo completamente per lasciare le skill senza
  restrizioni per impostazione predefinita.
</ParamField>

<ParamField path="agents.list[].skills" type="string[]">
  Insieme finale esplicito delle skill per tale agente. Gli elenchi espliciti
  **sostituiscono** completamente i valori predefiniti ereditati, senza unirsi a essi.
  Imposta `[]` per non esporre alcuna skill a tale agente.
</ParamField>

<Warning>
  Gli elenchi consentiti delle skill degli agenti costituiscono un filtro di visibilità
  e caricamento per il rilevamento delle skill di OpenClaw, i prompt, il rilevamento dei
  comandi slash, la sincronizzazione della sandbox e le istantanee delle skill. Non
  costituiscono un limite di autorizzazione al momento dell'esecuzione della shell. Se un
  agente può eseguire `exec` sull'host, tale shell può comunque eseguire client esterni o
  leggere i file dell'host visibili all'utente di esecuzione, inclusi i registri dei client
  MCP come `~/.openclaw/skills/config/mcporter.json`. Per isolare MCP per agente, combina
  gli elenchi consentiti delle skill con l'isolamento tramite sandbox/utente del sistema
  operativo, nega o limita rigorosamente tramite un elenco consentito l'esecuzione di
  `exec` sull'host e preferisci credenziali per agente sul server MCP.
</Warning>

## Workshop (`skills.workshop`)

<ParamField path="skills.workshop.autonomous.enabled" type="boolean" default="false">
  Quando è `true`, gli agenti possono creare proposte in sospeso a partire da
  segnali persistenti delle conversazioni dopo turni completati con successo.
  La creazione di skill richiesta dall'utente passa sempre attraverso Skill
  Workshop, indipendentemente da questa impostazione.
</ParamField>

<ParamField path="skills.workshop.approvalPolicy" type='"pending" | "auto"' default='"pending"'>
  `pending` richiede l'approvazione dell'operatore prima che l'agente avvii
  l'applicazione, il rifiuto o la quarantena. `auto` consente queste azioni
  senza approvazione.
</ParamField>

<ParamField path="skills.workshop.allowSymlinkTargetWrites" type="boolean" default="false">
  Consente all'applicazione tramite Skill Workshop di scrivere attraverso i
  collegamenti simbolici alle skill dell'area di lavoro la cui destinazione
  reale è già considerata attendibile da `skills.load.allowSymlinkTargets`.
  Mantieni questa opzione disabilitata, a meno che l'applicazione delle
  proposte generate non debba modificare la radice condivisa delle skill.
</ParamField>

<ParamField path="skills.workshop.maxPending" type="number" default="50">
  Numero massimo di proposte in sospeso e in quarantena conservate per area di
  lavoro (intervallo consentito: 1-200).
</ParamField>

<ParamField path="skills.workshop.maxSkillBytes" type="number" default="40000">
  Dimensione massima del corpo della proposta in byte (intervallo consentito:
  1024-200000). Le descrizioni delle proposte hanno separatamente un limite
  rigido di 160 byte, perché compaiono nell'output di individuazione ed elenco.
</ParamField>

Consulta [Skill Workshop](/it/tools/skill-workshop) per il ciclo di vita delle
proposte, i comandi CLI, i parametri degli strumenti degli agenti e i metodi
Gateway controllati da questa configurazione.

## Radici delle skill con collegamenti simbolici

Per impostazione predefinita, le radici delle skill dell'area di lavoro,
dell'agente di progetto, delle directory aggiuntive e delle skill incluse
costituiscono limiti di contenimento. Una cartella di skill con collegamento
simbolico in `<workspace>/skills` che viene risolta all'esterno della radice
viene ignorata e viene registrato un messaggio nel log.

Per consentire intenzionalmente una struttura con collegamenti simbolici,
dichiara la destinazione attendibile:

```json5
{
  skills: {
    load: {
      extraDirs: ["~/Projects/manager/skills"],
      allowSymlinkTargets: ["~/Projects/manager/skills"],
    },
  },
}
```

Con questa configurazione,
`<workspace>/skills/manager -> ~/Projects/manager/skills` viene accettato dopo
la risoluzione del percorso reale. `extraDirs` analizza direttamente il
repository adiacente; `allowSymlinkTargets` mantiene il percorso con
collegamento simbolico per le strutture esistenti.

Per impostazione predefinita, l'applicazione tramite Skill Workshop non scrive
attraverso questi collegamenti simbolici. Per consentire all'applicazione
tramite Workshop di modificare le skill nelle destinazioni di collegamenti
simbolici già considerate attendibili, abilita separatamente questa opzione:

```json5
{
  skills: {
    load: {
      allowSymlinkTargets: ["~/Projects/manager/skills"],
    },
    workshop: {
      allowSymlinkTargetWrites: true,
    },
  },
}
```

Le directory gestite `~/.openclaw/skills` e personali `~/.agents/skills`
accettano già senza condizioni i collegamenti simbolici alle directory delle
skill (il contenimento di `SKILL.md` per ogni skill continua ad applicarsi):
`allowSymlinkTargets` è necessario solo per le radici dell'area di lavoro,
delle directory aggiuntive e dell'agente di progetto
(`<workspace>/.agents/skills`).

## Skill in ambiente isolato e variabili di ambiente

<Warning>
  `skills.entries.<skill>.env` e `apiKey` si applicano solo alle esecuzioni
  sull'**host**. All'interno di un ambiente isolato non hanno alcun effetto:
  una skill che dipende da `GEMINI_API_KEY` non riuscirà con
  `apiKey not configured`, a meno che la variabile non venga fornita
  separatamente all'ambiente isolato.
</Warning>

Passa i segreti a un ambiente isolato Docker con:

```json5
{
  agents: {
    defaults: {
      sandbox: {
        docker: {
          env: { GEMINI_API_KEY: "your-key-here" },
        },
      },
    },
  },
}
```

<Note>
  Gli utenti con accesso al daemon Docker possono esaminare i valori di
  `sandbox.docker.env` tramite i metadati Docker. Quando tale esposizione non è
  accettabile, utilizza un file di segreti montato, un'immagine personalizzata
  o un altro metodo di distribuzione.
</Note>

## Promemoria sull'ordine di caricamento

```text
workspace/skills      (priorità massima)
workspace/.agents/skills
~/.agents/skills
~/.openclaw/skills
skill incluse
skills.load.extraDirs (priorità minima)
```

Le modifiche alle skill e alla configurazione diventano effettive nella nuova
sessione successiva quando il monitoraggio è abilitato, oppure nel turno
successivo dell'agente quando il monitoraggio rileva una modifica.

## Contenuti correlati

<CardGroup cols={2}>
  <Card title="Riferimento delle skill" href="/it/tools/skills" icon="puzzle-piece">
    Definizione delle skill, ordine di caricamento, controllo dell'accesso e
    formato di SKILL.md.
  </Card>
  <Card title="Creazione delle skill" href="/it/tools/creating-skills" icon="hammer">
    Creazione di skill personalizzate per l'area di lavoro.
  </Card>
  <Card title="Skill Workshop" href="/it/tools/skill-workshop" icon="flask">
    Coda delle proposte per le skill redatte dagli agenti.
  </Card>
  <Card title="Comandi slash" href="/it/tools/slash-commands" icon="terminal">
    Catalogo nativo dei comandi slash e direttive per la chat.
  </Card>
</CardGroup>
