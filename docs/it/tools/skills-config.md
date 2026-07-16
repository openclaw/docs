---
read_when:
    - Configurazione del caricamento, dell'installazione o del comportamento di abilitazione delle Skills
    - Impostazione della visibilità delle Skills per agente
    - Modifica dei limiti o dei criteri di approvazione di Skill Workshop
sidebarTitle: Skills config
summary: Riferimento completo per lo schema di configurazione `skills.*`, gli elenchi di elementi consentiti degli agenti, le impostazioni del workshop e la gestione delle variabili di ambiente della sandbox.
title: Configurazione delle Skills
x-i18n:
    generated_at: "2026-07-16T15:01:37Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 1633364a7333ba00f5f6c8d6f1f478b65e63bc97de23705e492eb980967ec521
    source_path: tools/skills-config.md
    workflow: 16
---

La maggior parte della configurazione delle Skills si trova sotto `skills` in
`~/.openclaw/openclaw.json`. La visibilità specifica dell'agente si trova sotto
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
      approvalPolicy: "auto",
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
  Per la generazione di immagini integrata, usare `agents.defaults.imageGenerationModel`
  insieme allo strumento principale `image_generate` invece di `skills.entries`. Le voci delle Skills
  sono destinate esclusivamente a flussi di lavoro delle Skills personalizzati o di terze parti.
</Note>

## Caricamento (`skills.load`)

<ParamField path="skills.load.extraDirs" type="string[]">
  Directory aggiuntive delle Skills da analizzare, con la precedenza più bassa (sotto
  le Skills incluse e dei Plugin). I percorsi vengono espansi con il supporto di `~`.
</ParamField>

<ParamField path="skills.load.allowSymlinkTargets" type="string[]">
  Directory di destinazione reali e attendibili nelle quali possono risolversi
  le cartelle delle Skills collegate simbolicamente, anche quando il collegamento simbolico si trova
  all'esterno della radice configurata. Usare questa opzione per layout intenzionali con repository adiacenti, come
  `<workspace>/skills/manager -> ~/Projects/manager/skills`. Mantenere questo elenco
  ristretto: non indicare radici ampie come `~` o `~/Projects`.
</ParamField>

<ParamField path="skills.load.watch" type="boolean" default="true">
  Monitora le cartelle delle Skills e aggiorna l'istantanea delle Skills quando cambiano
  i file `SKILL.md`. Include i file annidati nelle radici raggruppate delle Skills.
</ParamField>

<ParamField path="skills.load.watchDebounceMs" type="number" default="250">
  Finestra di debounce in millisecondi per gli eventi del monitoraggio delle Skills.
</ParamField>

## Installazione (`skills.install`)

<ParamField path="skills.install.preferBrew" type="boolean" default="true">
  Preferisce i programmi di installazione Homebrew quando `brew` è disponibile.
</ParamField>

<ParamField path="skills.install.nodeManager" type='"npm" | "pnpm" | "yarn" | "bun"' default='"npm"'>
  Gestore di pacchetti Node preferito per le installazioni delle Skills. Questa impostazione interessa soltanto
  le installazioni delle Skills: la CLI di OpenClaw e il runtime del Gateway richiedono Node perché
  l'archivio di stato canonico usa `node:sqlite`. `openclaw setup --node-manager` e
  `openclaw onboard --node-manager` accettano `npm`, `pnpm` o `bun`; impostare
  `"yarn"` direttamente nella configurazione per le installazioni delle Skills basate su Yarn.
</ParamField>

<ParamField path="skills.install.allowUploadedArchives" type="boolean" default="false">
  Consente ai client Gateway `operator.admin` attendibili di installare archivi zip
  privati preparati tramite `skills.upload.*`. Le normali installazioni da ClawHub non
  richiedono questa impostazione.
</ParamField>

## Criteri di installazione dell'operatore (`security.installPolicy`)

Usare `security.installPolicy` quando gli operatori necessitano di un comando locale attendibile per
approvare o bloccare le installazioni di Skills e Plugin in base a criteri specifici dell'host. I
criteri vengono eseguiti dopo che OpenClaw ha preparato il materiale sorgente e prima che
l'installazione o l'aggiornamento prosegua. Si applicano alle Skills di ClawHub, alle Skills caricate, alle Skills
Git/locali, ai programmi di installazione delle dipendenze delle Skills e alle origini di installazione/aggiornamento
dei Plugin.

```json5
{
  security: {
    installPolicy: {
      enabled: true,
      // Omettere targets per includere ogni destinazione supportata.
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
  Abilita i criteri di installazione gestiti dall'operatore. Se abilitati senza un comando
  `exec` valido, le installazioni vengono bloccate per impostazione predefinita.
</ParamField>

<ParamField path="security.installPolicy.targets" type='("skill" | "plugin")[]'>
  Filtro facoltativo delle destinazioni. Se omesso, i criteri si applicano a ogni
  destinazione supportata, affinché le nuove installazioni non vengano inaspettatamente consentite.
</ParamField>

<ParamField path="security.installPolicy.exec.command" type="string">
  Percorso assoluto dell'eseguibile attendibile dei criteri. OpenClaw lo esegue senza
  una shell e convalida il percorso prima dell'uso.
</ParamField>

<ParamField path="security.installPolicy.exec.args" type="string[]">
  Argomenti statici passati dopo `command`.
</ParamField>

<ParamField path="security.installPolicy.exec.timeoutMs" type="number" default="10000">
  Durata massima effettiva di una decisione dei criteri.
</ParamField>

<ParamField path="security.installPolicy.exec.noOutputTimeoutMs" type="number" default="timeoutMs">
  Tempo massimo senza output su stdout o stderr prima che i criteri blocchino
  per impostazione predefinita.
</ParamField>

<ParamField path="security.installPolicy.exec.maxOutputBytes" type="number" default="1048576">
  Numero massimo complessivo di byte di stdout e stderr accettati dal processo dei criteri.
</ParamField>

<ParamField path="security.installPolicy.exec.env" type="Record<string, string>">
  Variabili d'ambiente letterali fornite al processo dei criteri.
</ParamField>

<ParamField path="security.installPolicy.exec.passEnv" type="string[]">
  Nomi delle variabili d'ambiente copiati dal processo OpenClaw nel
  processo dei criteri. Vengono passate soltanto le variabili indicate.
</ParamField>

<ParamField path="security.installPolicy.exec.trustedDirs" type="string[]">
  Elenco facoltativo delle directory consentite che possono contenere l'eseguibile dei criteri.
</ParamField>

<ParamField path="security.installPolicy.exec.allowInsecurePath" type="boolean" default="false">
  Ignora i controlli sulla proprietà e sui permessi del percorso del comando. Usare questa opzione soltanto quando il
  percorso è protetto da un altro meccanismo.
</ParamField>

<ParamField path="security.installPolicy.exec.allowSymlinkCommand" type="boolean" default="false">
  Consente che il percorso configurato del comando sia un collegamento simbolico. La destinazione risolta
  deve comunque soddisfare gli altri controlli del percorso. Gli argomenti degli script dell'interprete devono
  essere file regolari diretti, non collegamenti simbolici.
</ParamField>

I criteri ricevono su stdin un oggetto JSON contenente `protocolVersion: 1`,
`openclawVersion`, `targetType`, `targetName`, `sourcePath`, `sourcePathKind`,
il valore strutturato facoltativo `source`, il valore strutturato `origin` e `request`. Devono
scrivere un oggetto JSON su stdout: `{ "protocolVersion": 1, "decision": "allow" }`
oppure `{ "protocolVersion": 1, "decision": "block", "reason": "..." }`. Un codice di uscita diverso da zero,
un timeout, JSON non valido, campi mancanti o versioni del protocollo non supportate
comportano il blocco per impostazione predefinita.

OpenClaw non esegue i criteri di installazione durante il normale avvio del Gateway.
Le installazioni e gli aggiornamenti vengono bloccati per impostazione predefinita quando i criteri sono abilitati ma non disponibili.
`openclaw doctor` esegue la convalida statica; `openclaw doctor --deep`
esegue una verifica sintetica dell'installazione usando il comando configurato.

Gli aggiornamenti in blocco applicano i criteri a ciascuna destinazione: un aggiornamento bloccato di una Skill o di un Plugin non riesce
per tale destinazione senza disabilitare i criteri né ignorare le destinazioni successive
del gruppo.

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

Comando minimo per i criteri:

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
        reason: "i percorsi locali dei plugin non sono approvati su questo host",
      }),
    );
    return;
  }
  process.stdout.write(JSON.stringify({ protocolVersion: 1, decision: "allow" }));
});
```

## Elenco consentito delle Skills incluse

<ParamField path="skills.allowBundled" type="string[]">
  Elenco facoltativo consentito esclusivamente per le Skills **incluse**. Se impostato, soltanto le Skills incluse
  presenti nell'elenco sono idonee. Le Skills gestite, a livello di agente e dello spazio di lavoro
  non sono interessate.
</ParamField>

## Voci per singola Skill (`skills.entries`)

Per impostazione predefinita, le chiavi sotto `entries` corrispondono a `name` della Skill. Se una Skill definisce
`metadata.openclaw.skillKey`, usare invece tale chiave. Racchiudere tra virgolette i nomi con trattini
(JSON5 consente chiavi tra virgolette).

<ParamField path="skills.entries.<key>.enabled" type="boolean">
  `false` disabilita la Skill anche se è inclusa o installata. La Skill inclusa
  `coding-agent` richiede l'abilitazione esplicita: impostarla su `true` e assicurarsi che
  `claude`, `codex`, `opencode` o un'altra CLI supportata sia installata e
  autenticata.
</ParamField>

<ParamField path="skills.entries.<key>.apiKey" type='string | { source, provider, id }'>
  Campo pratico per le Skills che dichiarano `metadata.openclaw.primaryEnv`.
  Supporta una stringa di testo normale o un SecretRef: `{ source: "env", provider: "default", id: "VAR_NAME" }`.
</ParamField>

<ParamField path="skills.entries.<key>.env" type="Record<string, string>">
  Variabili d'ambiente inserite durante l'esecuzione dell'agente. Vengono inserite soltanto quando la
  variabile non è già impostata nel processo.
</ParamField>

<ParamField path="skills.entries.<key>.config" type="object">
  Contenitore facoltativo per campi di configurazione personalizzati per singola Skill.
</ParamField>

## Elenchi consentiti degli agenti (`agents`)

Usare la configurazione dell'agente quando si desiderano le stesse radici delle Skills della macchina/dello spazio di lavoro, ma
un insieme diverso di Skills visibili per ciascun agente.

```json5
{
  agents: {
    defaults: {
      skills: ["github", "weather"], // base condivisa
    },
    list: [
      { id: "writer" }, // eredita github, weather
      { id: "docs", skills: ["docs-search"] }, // sostituisce completamente i valori predefiniti
      { id: "locked-down", skills: [] }, // nessuna Skill
    ],
  },
}
```

<ParamField path="agents.defaults.skills" type="string[]">
  Elenco consentito di base condiviso, ereditato dagli agenti che omettono
  `agents.list[].skills`. Ometterlo completamente per lasciare le Skills senza restrizioni
  per impostazione predefinita.
</ParamField>

<ParamField path="agents.list[].skills" type="string[]">
  Insieme finale esplicito di Skills per tale agente. Gli elenchi espliciti **sostituiscono**
  i valori predefiniti ereditati, senza unirsi a essi. Impostare su `[]` per non esporre alcuna Skill a
  tale agente.
</ParamField>

<Warning>
  Gli elenchi consentiti delle Skills degli agenti sono un filtro di visibilità e caricamento per il rilevamento
  delle Skills di OpenClaw, i prompt, il rilevamento dei comandi slash, la sincronizzazione della sandbox e le
  istantanee delle Skills. Non costituiscono un limite di autorizzazione durante l'esecuzione della shell. Se un agente
  può eseguire `exec` sull'host, tale shell può comunque eseguire client esterni o leggere
  file dell'host visibili all'utente di esecuzione, inclusi i registri dei client MCP
  come `~/.openclaw/skills/config/mcporter.json`. Per
  isolare MCP per agente, combinare gli elenchi consentiti delle Skills con l'isolamento tramite sandbox/utente del sistema operativo,
  negare l'esecuzione sull'host o limitarla rigorosamente tramite un elenco consentito e preferire credenziali
  per agente nel server MCP.
</Warning>

## Workshop (`skills.workshop`)

<ParamField path="skills.workshop.autonomous.enabled" type="boolean" default="false">
  Quando `true`, OpenClaw può creare proposte in sospeso a partire da correzioni persistenti
  e può esaminare il lavoro completato con successo, sostanziale, dopo che il sistema diventa
  inattivo. Ciò può aggiungere un'esecuzione del modello in background dopo i turni idonei. La creazione
  di skill richiesta dall'utente e `/learn` continuano a funzionare quando l'impostazione è `false`.
</ParamField>

Consultare [Autoapprendimento](/tools/self-learning) per idoneità, privacy, costi,
autorizzazioni limitate alle proposte e risoluzione dei problemi.

<ParamField path="skills.workshop.approvalPolicy" type='"pending" | "auto"' default='"auto"'>
  `auto` consente l'applicazione, il rifiuto o la quarantena avviati dall'agente senza
  un'ulteriore richiesta di approvazione. `pending` richiede l'approvazione dell'operatore.
</ParamField>

<ParamField path="skills.workshop.allowSymlinkTargetWrites" type="boolean" default="false">
  Consente all'applicazione di Skill Workshop di scrivere attraverso i collegamenti simbolici delle skill dell'area di lavoro il cui
  percorso di destinazione reale è già considerato attendibile da `skills.load.allowSymlinkTargets`. Mantenere
  disabilitata questa opzione, a meno che l'applicazione delle proposte generate debba modificare la radice
  condivisa delle skill.
</ParamField>

<ParamField path="skills.workshop.maxPending" type="number" default="50">
  Numero massimo di proposte in sospeso e in quarantena conservate per area di lavoro (intervallo
  consentito: 1-200).
</ParamField>

<ParamField path="skills.workshop.maxSkillBytes" type="number" default="40000">
  Dimensione massima del corpo della proposta in byte (intervallo consentito: 1024-200000). Le descrizioni
  delle proposte hanno separatamente un limite rigido di 160 byte, perché compaiono
  nell'output di individuazione e di elenco.
</ParamField>

Consultare [Skill Workshop](/it/tools/skill-workshop) per il ciclo di vita delle proposte, i comandi
CLI, i parametri degli strumenti dell'agente e i metodi del Gateway controllati da questa configurazione.

## Radici delle skill con collegamenti simbolici

Per impostazione predefinita, le radici delle skill dell'area di lavoro, dell'agente di progetto, delle directory aggiuntive e di quelle incluse
costituiscono limiti di contenimento. Una cartella di skill con collegamento simbolico sotto `<workspace>/skills`
che viene risolta all'esterno della radice viene ignorata con un messaggio nel log.

Per consentire una struttura intenzionale di collegamenti simbolici, dichiarare attendibile la destinazione:

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

Con questa configurazione, `<workspace>/skills/manager -> ~/Projects/manager/skills`
viene accettato dopo la risoluzione del percorso reale. `extraDirs` analizza direttamente il repository
adiacente; `allowSymlinkTargets` conserva il percorso con collegamento simbolico per le strutture
esistenti.

Per impostazione predefinita, l'applicazione di Skill Workshop non scrive attraverso questi collegamenti simbolici. Per
consentire all'applicazione di Workshop di modificare le skill nelle destinazioni con collegamenti simbolici già considerate attendibili, abilitare
separatamente questa opzione:

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
accettano già incondizionatamente i collegamenti simbolici alle directory delle skill (il contenimento
`SKILL.md` per singola skill continua ad applicarsi) — `allowSymlinkTargets` è necessario solo
per le radici dell'area di lavoro, delle directory aggiuntive e dell'agente di progetto (`<workspace>/.agents/skills`).

## Skill in sandbox e variabili di ambiente

<Warning>
  `skills.entries.<skill>.env` e `apiKey` si applicano solo alle esecuzioni sull'**host**.
  All'interno di una sandbox non hanno alcun effetto: una skill che dipende da
  `GEMINI_API_KEY` non riuscirà con `apiKey not configured`, a meno che la variabile
  non venga fornita separatamente alla sandbox.
</Warning>

Passare i segreti a una sandbox Docker con:

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
  Gli utenti con accesso al daemon Docker possono esaminare i valori `sandbox.docker.env`
  tramite i metadati Docker. Quando tale esposizione non è accettabile, utilizzare un file di segreti montato, un'immagine personalizzata o
  un altro percorso di distribuzione.
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

Le modifiche alle skill e alla configurazione hanno effetto nella successiva nuova sessione quando il
monitoraggio è abilitato, oppure nel turno successivo dell'agente quando il monitoraggio rileva una
modifica.

## Contenuti correlati

<CardGroup cols={2}>
  <Card title="Riferimento delle skill" href="/it/tools/skills" icon="puzzle-piece">
    Cosa sono le skill, ordine di caricamento, criteri di abilitazione e formato SKILL.md.
  </Card>
  <Card title="Creazione delle skill" href="/it/tools/creating-skills" icon="hammer">
    Creazione di skill personalizzate per l'area di lavoro.
  </Card>
  <Card title="Skill Workshop" href="/it/tools/skill-workshop" icon="flask">
    Coda di proposte per le skill redatte dall'agente.
  </Card>
  <Card title="Autoapprendimento" href="/tools/self-learning" icon="brain">
    Proposte conservative e facoltative derivanti dal lavoro completato.
  </Card>
  <Card title="Comandi slash" href="/it/tools/slash-commands" icon="terminal">
    Catalogo nativo dei comandi slash e direttive della chat.
  </Card>
</CardGroup>
