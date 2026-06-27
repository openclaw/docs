---
read_when:
    - Configurazione del caricamento, dell'installazione o del comportamento di gating delle skill
    - Impostare la visibilità delle Skills per agente
    - Regolazione dei limiti o della policy di approvazione di Skill Workshop
sidebarTitle: Skills config
summary: Riferimento completo per lo schema di configurazione skills.*, gli allowlist degli agenti, le impostazioni del workshop e la gestione della variabile d’ambiente della sandbox.
title: Configurazione di Skills
x-i18n:
    generated_at: "2026-06-27T18:23:14Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7c1ba6beb1e06e7090dd6669320a91893bf26abe71633914e7564aebb59c637f
    source_path: tools/skills-config.md
    workflow: 16
---

La maggior parte della configurazione delle skill si trova sotto `skills` in
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
  insieme allo strumento core `image_generate` invece di `skills.entries`. Le
  voci delle skill sono solo per flussi di lavoro di skill personalizzati o di terze parti.
</Note>

## Caricamento (`skills.load`)

<ParamField path="skills.load.extraDirs" type="string[]">
  Directory di skill aggiuntive da analizzare, con la precedenza più bassa (dopo le skill
  incluse e dei Plugin). I percorsi vengono espansi con supporto per `~`.
</ParamField>

<ParamField path="skills.load.allowSymlinkTargets" type="string[]">
  Directory di destinazione reali attendibili verso cui possono risolversi le cartelle di skill
  collegate tramite symlink, anche quando il symlink si trova fuori dalla radice configurata. Usa questa opzione per
  layout intenzionali con repository affiancati, come
  `<workspace>/skills/manager -> ~/Projects/manager/skills`. Mantieni questo elenco
  ristretto: non puntare a radici ampie come `~` o `~/Projects`.
</ParamField>

<ParamField path="skills.load.watch" type="boolean" default="true">
  Monitora le cartelle delle skill e aggiorna lo snapshot delle skill quando i file `SKILL.md`
  cambiano. Copre i file annidati sotto radici di skill raggruppate.
</ParamField>

<ParamField path="skills.load.watchDebounceMs" type="number" default="250">
  Finestra di debounce per gli eventi del watcher delle skill, in millisecondi.
</ParamField>

## Installazione (`skills.install`)

<ParamField path="skills.install.preferBrew" type="boolean" default="true">
  Preferisci gli installer Homebrew quando `brew` è disponibile.
</ParamField>

<ParamField path="skills.install.nodeManager" type='"npm" | "pnpm" | "yarn" | "bun"' default='"npm"'>
  Preferenza del gestore di pacchetti Node per le installazioni delle skill. Questo influisce solo sulle installazioni delle skill:
  il runtime Gateway dovrebbe comunque usare Node (Bun non è consigliato
  per WhatsApp/Telegram). Usa `openclaw setup --node-manager` per npm, pnpm
  o bun; imposta `"yarn"` manualmente per installazioni di skill basate su Yarn.
</ParamField>

<ParamField path="skills.install.allowUploadedArchives" type="boolean" default="false">
  Consenti ai client Gateway `operator.admin` attendibili di installare archivi zip
  privati preparati tramite `skills.upload.*`. Le normali installazioni da ClawHub non
  richiedono questa impostazione.
</ParamField>

## Criterio di installazione dell'operatore (`security.installPolicy`)

Usa `security.installPolicy` quando gli operatori hanno bisogno di un comando locale attendibile per
approvare o bloccare installazioni di skill e Plugin con un criterio specifico dell'host. Il criterio
viene eseguito dopo che OpenClaw ha preparato il materiale sorgente e prima che l'installazione o l'aggiornamento
continui. Si applica alle skill ClawHub, alle skill caricate, alle skill Git/locali,
agli installer delle dipendenze delle skill e alle origini di installazione/aggiornamento dei Plugin.

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
  Abilita il criterio di installazione di proprietà dell'operatore. Quando è abilitato senza un comando `exec`
  valido, le installazioni falliscono in modo chiuso.
</ParamField>

<ParamField path="security.installPolicy.targets" type='("skill" | "plugin")[]'>
  Filtro di destinazione opzionale. Quando omesso, il criterio si applica a ogni destinazione supportata,
  in modo che le nuove installazioni non falliscano inaspettatamente in modo aperto.
</ParamField>

<ParamField path="security.installPolicy.exec.command" type="string">
  Percorso assoluto dell'eseguibile del criterio attendibile. OpenClaw lo esegue senza una
  shell e convalida il percorso prima dell'uso.
</ParamField>

<ParamField path="security.installPolicy.exec.args" type="string[]">
  Argomenti statici passati dopo `command`.
</ParamField>

<ParamField path="security.installPolicy.exec.timeoutMs" type="number" default="10000">
  Runtime massimo in tempo reale per una decisione del criterio.
</ParamField>

<ParamField path="security.installPolicy.exec.noOutputTimeoutMs" type="number" default="timeoutMs">
  Tempo massimo senza output su stdout o stderr prima che il criterio fallisca in modo chiuso.
</ParamField>

<ParamField path="security.installPolicy.exec.maxOutputBytes" type="number" default="1048576">
  Numero massimo di byte combinati di stdout e stderr accettati dal processo del criterio.
</ParamField>

<ParamField path="security.installPolicy.exec.env" type="Record<string, string>">
  Variabili d'ambiente letterali fornite al processo del criterio.
</ParamField>

<ParamField path="security.installPolicy.exec.passEnv" type="string[]">
  Nomi delle variabili d'ambiente copiati dal processo OpenClaw al processo del criterio.
  Vengono passate solo le variabili nominate.
</ParamField>

<ParamField path="security.installPolicy.exec.trustedDirs" type="string[]">
  Allowlist opzionale di directory che possono contenere l'eseguibile del criterio.
</ParamField>

<ParamField path="security.installPolicy.exec.allowInsecurePath" type="boolean" default="false">
  Bypassa i controlli di proprietà e permessi del percorso del comando. Usa questa opzione solo quando il percorso
  è protetto da un altro meccanismo.
</ParamField>

<ParamField path="security.installPolicy.exec.allowSymlinkCommand" type="boolean" default="false">
  Consente al percorso del comando configurato di essere un symlink. La destinazione risolta deve
  comunque soddisfare gli altri controlli del percorso. Gli argomenti degli script dell'interprete devono essere
  file regolari diretti, non symlink.
</ParamField>

Il criterio riceve un oggetto JSON su stdin con `protocolVersion: 1`,
`openclawVersion`, `targetType`, `targetName`, `sourcePath`, `sourcePathKind`,
`source` strutturato opzionale, `origin` strutturato e `request`. Deve scrivere
un oggetto JSON su stdout: `{ "protocolVersion": 1, "decision": "allow" }` oppure
`{ "protocolVersion": 1, "decision": "block", "reason": "..." }`. Uscita diversa da zero,
timeout, JSON malformato, campi mancanti o versioni di protocollo non supportate
falliscono in modo chiuso.

OpenClaw non esegue il criterio di installazione durante il normale avvio del Gateway. Le installazioni
e gli aggiornamenti falliscono in modo chiuso quando il criterio è abilitato ma non disponibile. `openclaw doctor`
esegue una convalida statica e `openclaw doctor --deep` esegue una sonda di installazione
sintetica contro il comando configurato.

Gli aggiornamenti in blocco applicano il criterio per destinazione: un aggiornamento di skill o Plugin bloccato fallisce
per quella destinazione senza disabilitare il criterio o saltare le destinazioni successive nel batch.

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

## Allowlist delle skill incluse

<ParamField path="skills.allowBundled" type="string[]">
  Allowlist opzionale solo per le skill **incluse**. Quando impostata, solo le skill incluse
  nell'elenco sono idonee. Le skill gestite, a livello di agente e dell'area di lavoro
  non sono interessate.
</ParamField>

## Voci per skill (`skills.entries`)

Le chiavi sotto `entries` corrispondono per impostazione predefinita al `name` della skill. Se una skill definisce
`metadata.openclaw.skillKey`, usa invece quella chiave. Metti tra virgolette i nomi con trattino
(JSON5 consente chiavi tra virgolette).

<ParamField path="skills.entries.<key>.enabled" type="boolean">
  `false` disabilita la skill anche quando è inclusa o installata. La skill inclusa `coding-agent`
  è opt-in: impostala su `true` e assicurati che una tra `claude`,
  `codex`, `opencode` o un'altra CLI supportata sia installata e autenticata.
</ParamField>

<ParamField path="skills.entries.<key>.apiKey" type='string | { source, provider, id }'>
  Campo di comodità per skill che dichiarano `metadata.openclaw.primaryEnv`.
  Supporta una stringa in testo semplice o un SecretRef: `{ source: "env", provider: "default", id: "VAR_NAME" }`.
</ParamField>

<ParamField path="skills.entries.<key>.env" type="Record<string, string>">
  Variabili d'ambiente iniettate per l'esecuzione dell'agente. Vengono iniettate solo quando la
  variabile non è già impostata nel processo.
</ParamField>

<ParamField path="skills.entries.<key>.config" type="object">
  Contenitore opzionale per campi di configurazione personalizzati per skill.
</ParamField>

## Allowlist degli agenti (`agents`)

Usa la configurazione dell'agente quando vuoi le stesse radici di skill della macchina/area di lavoro ma un
set di skill visibili diverso per ogni agente.

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
  Allowlist di riferimento condivisa ereditata dagli agenti che omettono `agents.list[].skills`.
  Omettila del tutto per lasciare le skill senza restrizioni per impostazione predefinita.
</ParamField>

<ParamField path="agents.list[].skills" type="string[]">
  Set finale esplicito di skill per quell'agente. Gli elenchi espliciti **sostituiscono** i valori predefiniti
  ereditati: non vengono uniti. Imposta su `[]` per non esporre alcuna skill a quell'agente.
</ParamField>

## Workshop (`skills.workshop`)

<ParamField path="skills.workshop.autonomous.enabled" type="boolean" default="false">
  Quando `true`, gli agenti possono creare proposte in sospeso da segnali di conversazione durevoli
  dopo turni riusciti. La creazione di skill richiesta dall'utente passa sempre
  attraverso il Workshop delle skill indipendentemente da questa impostazione.
</ParamField>

<ParamField path="skills.workshop.approvalPolicy" type='"pending" | "auto"' default='"pending"'>
  `pending` richiede l'approvazione dell'operatore prima di apply, reject o
  quarantine avviati dall'agente. `auto` consente queste azioni senza approvazione.
</ParamField>

<ParamField path="skills.workshop.allowSymlinkTargetWrites" type="boolean" default="false">
  Consenti ad apply del Workshop delle skill di scrivere attraverso symlink di skill dell'area di lavoro la cui
  destinazione reale è già attendibile da `skills.load.allowSymlinkTargets`. Mantieni questa opzione
  disabilitata a meno che gli apply delle proposte generate debbano modificare quella radice di skill condivisa.
</ParamField>

<ParamField path="skills.workshop.maxPending" type="number" default="50">
  Numero massimo di proposte in sospeso e in quarantena conservate per workspace.
</ParamField>

<ParamField path="skills.workshop.maxSkillBytes" type="number" default="40000">
  Dimensione massima del corpo della proposta in byte. Le descrizioni delle proposte hanno un limite rigido di
  160 byte perché compaiono nell'output di individuazione ed elenco.
</ParamField>

## Radici delle skill collegate con symlink

Per impostazione predefinita, le radici delle skill di workspace, agent di progetto, directory extra e bundled sono
confini di contenimento. Una cartella skill collegata con symlink sotto `<workspace>/skills`
che si risolve fuori dalla radice viene ignorata con un messaggio di log.

Per consentire una struttura di symlink intenzionale, dichiara la destinazione attendibile:

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

Con questa configurazione, `<workspace>/skills/manager -> ~/Projects/manager/skills` viene
accettato dopo la risoluzione realpath. `extraDirs` scansiona direttamente il repo adiacente;
`allowSymlinkTargets` preserva il percorso con symlink per le strutture esistenti.

Per impostazione predefinita, l'applicazione dello Skill Workshop non scrive attraverso quei symlink. Per consentire
a Workshop apply di modificare skill sotto destinazioni symlink già attendibili, abilitalo
separatamente:

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
accettano già symlink a directory skill (il contenimento per skill di `SKILL.md` continua
ad applicarsi).

## Skill in sandbox e variabili env

<Warning>
  `skills.entries.<skill>.env` e `apiKey` si applicano solo alle esecuzioni **host**. Dentro
  una sandbox non hanno effetto: una skill che dipende da `GEMINI_API_KEY` fallirà
  con `apiKey not configured` a meno che la variabile non venga fornita alla sandbox
  separatamente.
</Warning>

Passa i segreti in una sandbox Docker con:

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
  Gli utenti con accesso al daemon Docker possono ispezionare i valori di `sandbox.docker.env`
  tramite i metadati Docker. Usa un file di segreto montato, un'immagine personalizzata o
  un altro percorso di consegna quando tale esposizione non è accettabile.
</Note>

## Promemoria sull'ordine di caricamento

```text
workspace/skills      (highest)
workspace/.agents/skills
~/.agents/skills
~/.openclaw/skills
bundled skills
skills.load.extraDirs (lowest)
```

Le modifiche a skill e configurazione hanno effetto nella nuova sessione successiva quando il
watcher è abilitato, oppure al turno successivo dell'agent quando il watcher rileva una modifica.

## Correlati

<CardGroup cols={2}>
  <Card title="Riferimento delle skill" href="/it/tools/skills" icon="puzzle-piece">
    Che cosa sono le skill, ordine di caricamento, gating e formato SKILL.md.
  </Card>
  <Card title="Creazione di skill" href="/it/tools/creating-skills" icon="hammer">
    Creazione di skill workspace personalizzate.
  </Card>
  <Card title="Skill Workshop" href="/it/tools/skill-workshop" icon="flask">
    Coda di proposte per skill redatte dall'agent.
  </Card>
  <Card title="Comandi slash" href="/it/tools/slash-commands" icon="terminal">
    Catalogo nativo dei comandi slash e direttive chat.
  </Card>
</CardGroup>
