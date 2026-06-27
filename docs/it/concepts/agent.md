---
read_when:
    - Modifica del runtime dell'agente, del bootstrap dell'area di lavoro o del comportamento della sessione
summary: Runtime dell'agente, contratto dell'area di lavoro e bootstrap della sessione
title: Runtime dell'agente
x-i18n:
    generated_at: "2026-06-27T17:24:00Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2fb4d3f0bb6e8aa2a23d00f5def5eb0ffa152bc75f82a12c40ac7ed00776011c
    source_path: concepts/agent.md
    workflow: 16
---

OpenClaw esegue un **singolo runtime agente incorporato**: un processo agente per
Gateway, con il proprio workspace, file di bootstrap e archivio sessioni. Questa pagina
descrive quel contratto di runtime: cosa deve contenere il workspace, quali file vengono
iniettati e come le sessioni eseguono il bootstrap rispetto a esso.

## Workspace (obbligatorio)

OpenClaw usa una singola directory workspace dell'agente (`agents.defaults.workspace`) come **unica** directory di lavoro (`cwd`) dell'agente per strumenti e contesto.

Consigliato: usa `openclaw setup` per creare `~/.openclaw/openclaw.json` se manca e inizializzare i file del workspace.

Layout completo del workspace + guida al backup: [Workspace dell'agente](/it/concepts/agent-workspace)

Se `agents.defaults.sandbox` è abilitato, le sessioni non principali possono sovrascriverlo con
workspace per sessione sotto `agents.defaults.sandbox.workspaceRoot` (vedi
[Configurazione del Gateway](/it/gateway/configuration)).

## File di bootstrap (iniettati)

Dentro `agents.defaults.workspace`, OpenClaw si aspetta questi file modificabili dall'utente:

- `AGENTS.md` - istruzioni operative + "memoria"
- `SOUL.md` - persona, limiti, tono
- `TOOLS.md` - note sugli strumenti mantenute dall'utente (ad es. `imsg`, `sag`, convenzioni)
- `BOOTSTRAP.md` - rituale una tantum al primo avvio (eliminato dopo il completamento)
- `IDENTITY.md` - nome/vibrazione/emoji dell'agente
- `USER.md` - profilo utente + appellativo preferito

Al primo turno di una nuova sessione, OpenClaw inietta il contenuto di questi file nel Project Context del prompt di sistema.

I file vuoti vengono saltati. I file grandi vengono ridotti e troncati con un marcatore, così i prompt restano snelli (leggi il file per il contenuto completo).

Se un file manca, OpenClaw inietta una singola riga marcatore "file mancante" (e `openclaw setup` creerà un template predefinito sicuro).

`BOOTSTRAP.md` viene creato solo per un **workspace completamente nuovo** (nessun altro file di bootstrap presente). Finché è in sospeso, OpenClaw lo mantiene nel Project Context e aggiunge al prompt di sistema una guida al bootstrap per il rituale iniziale, invece di copiarlo nel messaggio dell'utente. Se lo elimini dopo aver completato il rituale, non dovrebbe essere ricreato ai riavvii successivi.

Dopo che un workspace è stato osservato, OpenClaw mantiene anche un marcatore di attestazione nella directory di stato per il percorso del workspace. Se un workspace attestato di recente scompare o viene cancellato, l'avvio rifiuta di rieseguire silenziosamente il seeding di `BOOTSTRAP.md`; ripristina il workspace oppure usa un reset completo dell'onboarding in modo che workspace e marcatore vengano cancellati insieme.

Per disabilitare completamente la creazione dei file di bootstrap (per workspace pre-popolati), imposta:

```json5
{ agents: { defaults: { skipBootstrap: true } } }
```

## Strumenti integrati

Gli strumenti core (read/exec/edit/write e gli strumenti di sistema correlati) sono sempre disponibili,
soggetti alla policy sugli strumenti. `apply_patch` è facoltativo e controllato da
`tools.exec.applyPatch`. `TOOLS.md` **non** controlla quali strumenti esistono; è
una guida su come _tu_ vuoi che vengano usati.

## Skills

OpenClaw carica le Skills da queste posizioni (precedenza più alta per prime):

- Workspace: `<workspace>/skills`
- Skills agente del progetto: `<workspace>/.agents/skills`
- Skills agente personali: `~/.agents/skills`
- Gestite/locali: `~/.openclaw/skills`
- Incluse (distribuite con l'installazione)
- Cartelle Skills extra: `skills.load.extraDirs`

Le radici delle Skills possono contenere cartelle raggruppate come
`<workspace>/skills/personal/foo/SKILL.md`; la Skill è comunque esposta tramite il suo
nome frontmatter piatto, ad esempio `foo`.

Le Skills possono essere controllate da config/env (vedi `skills` in [Configurazione del Gateway](/it/gateway/configuration)).

## Confini del runtime

Il runtime agente incorporato è di proprietà di OpenClaw: scoperta dei modelli, cablaggio degli strumenti,
assemblaggio del prompt, gestione delle sessioni e consegna sui canali condividono un'unica
superficie di runtime integrata.

## Sessioni

Le trascrizioni delle sessioni sono archiviate come JSONL in:

- `~/.openclaw/agents/<agentId>/sessions/<SessionId>.jsonl`

L'ID sessione è stabile e scelto da OpenClaw.
Le cartelle sessione legacy di altri strumenti non vengono lette.

## Guida durante lo streaming

I prompt in ingresso che arrivano a metà esecuzione vengono instradati nella run corrente per impostazione predefinita.
La guida viene consegnata **dopo che il turno assistant corrente ha finito di eseguire le sue
chiamate agli strumenti**, prima della chiamata LLM successiva, e non salta più le chiamate agli strumenti rimanenti
dal messaggio assistant corrente.

`/queue steer` è il comportamento predefinito per la run attiva. `/queue followup` e
`/queue collect` fanno attendere i messaggi per un turno successivo invece di guidare.
`/queue interrupt` interrompe invece la run attiva. Vedi [Coda](/it/concepts/queue)
e [Coda di guida](/it/concepts/queue-steering) per il comportamento di coda e confini.

Lo streaming a blocchi invia i blocchi assistant completati non appena terminano; è
**disattivato per impostazione predefinita** (`agents.defaults.blockStreamingDefault: "off"`).
Regola il confine tramite `agents.defaults.blockStreamingBreak` (`text_end` vs `message_end`; valore predefinito text_end).
Controlla la suddivisione morbida dei blocchi con `agents.defaults.blockStreamingChunk` (valore predefinito
800-1200 caratteri; preferisce interruzioni di paragrafo, poi nuove righe; frasi per ultime).
Aggrega i frammenti in streaming con `agents.defaults.blockStreamingCoalesce` per ridurre
lo spam su singola riga (unione basata su inattività prima dell'invio). I canali non Telegram richiedono
`*.blockStreaming: true` esplicito per abilitare le risposte a blocchi.
I riepiloghi dettagliati degli strumenti vengono emessi all'avvio dello strumento (nessun debounce); la Control UI
trasmette in streaming l'output degli strumenti tramite eventi agente quando disponibili.
Altri dettagli: [Streaming + suddivisione in frammenti](/it/concepts/streaming).

## Riferimenti ai modelli

I riferimenti ai modelli nella configurazione (ad esempio `agents.defaults.model` e `agents.defaults.models`) vengono analizzati dividendo sulla **prima** `/`.

- Usa `provider/model` quando configuri i modelli.
- Se l'ID modello contiene a sua volta `/` (stile OpenRouter), includi il prefisso del provider (esempio: `openrouter/moonshotai/kimi-k2`).
- Se ometti il provider, OpenClaw prova prima un alias, poi una corrispondenza univoca
  con un provider configurato per quell'esatto ID modello, e solo dopo torna
  al provider predefinito configurato. Se quel provider non espone più il
  modello predefinito configurato, OpenClaw ripiega sul primo
  provider/modello configurato invece di mostrare un predefinito obsoleto di un provider rimosso.

## Configurazione (minima)

Come minimo, imposta:

- `agents.defaults.workspace`
- `channels.whatsapp.allowFrom` (fortemente consigliato)

---

_Successivo: [Chat di gruppo](/it/channels/group-messages)_ 🦞

## Correlati

- [Workspace dell'agente](/it/concepts/agent-workspace)
- [Routing multi-agente](/it/concepts/multi-agent)
- [Gestione delle sessioni](/it/concepts/session)
