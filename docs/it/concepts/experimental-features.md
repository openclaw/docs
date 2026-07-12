---
read_when:
    - Vedi una chiave di configurazione `.experimental` e vuoi sapere se è stabile
    - Vuoi provare le funzionalità di anteprima del runtime senza confonderle con le impostazioni predefinite normali
    - Vuoi un unico posto in cui trovare i flag sperimentali attualmente documentati
summary: Cosa significano i flag sperimentali in OpenClaw e quali sono attualmente documentati
title: Funzionalità sperimentali
x-i18n:
    generated_at: "2026-07-12T06:58:57Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 1d4f6d066ef80cad2fb8a54c8aecb9fca5b4ed91cd5a3626dad4ad889dc3e8f2
    source_path: concepts/experimental-features.md
    workflow: 16
---

Le funzionalità sperimentali sono superfici di anteprima attivabili esplicitamente tramite flag. Richiedono un utilizzo più esteso in scenari reali prima di ottenere un'impostazione predefinita stabile o un contratto duraturo.

- Sono disattivate per impostazione predefinita, a meno che la documentazione non indichi di abilitarne una.
- La struttura e il comportamento possono cambiare più rapidamente rispetto alla configurazione stabile.
- Preferisci un percorso stabile quando ne esiste già uno.
- Distribuiscile su larga scala solo dopo averle testate in un ambiente più circoscritto.

## Flag attualmente documentati

| Superficie                     | Chiave                                                                                     | Usala quando                                                                                                                               | Ulteriori informazioni                                                                            |
| ------------------------------ | ------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------- |
| Runtime del modello locale     | `agents.defaults.experimental.localModelLean`, `agents.list[].experimental.localModelLean` | Un backend locale più piccolo o più rigoroso non riesce a gestire l'intera superficie predefinita degli strumenti di OpenClaw              | [Modelli locali](/it/gateway/local-models)                                                            |
| Ricerca nella memoria          | `agents.defaults.memorySearch.experimental.sessionMemory`                                  | Vuoi che `memory_search` indicizzi le trascrizioni delle sessioni precedenti e accetti il costo aggiuntivo di archiviazione e indicizzazione | [Riferimento per la configurazione della memoria](/it/reference/memory-config#session-memory-search-experimental) |
| Harness Codex                  | `plugins.entries.codex.config.appServer.experimental.sandboxExecServer`                    | Vuoi che l'app-server nativo di Codex 0.132.0 o successivo utilizzi un exec-server basato sulla sandbox di OpenClaw anziché disabilitare Code Mode | [Riferimento per l'harness Codex](/it/plugins/codex-harness-reference#sandboxed-native-execution)      |
| Strumento di pianificazione strutturata | `tools.experimental.planTool`                                                       | Vuoi esporre lo strumento strutturato `update_plan` per monitorare attività in più passaggi nei runtime e nelle interfacce utente compatibili | [Riferimento per la configurazione del Gateway](/it/gateway/config-tools#toolsexperimental)            |

## Modalità snella per i modelli locali

`agents.defaults.experimental.localModelLean: true` rimuove a ogni turno gli strumenti opzionali più pesanti dalla superficie diretta dell'agente: `browser`, `cron`, `message`, `image_generate`, `music_generate`, `video_generate`, `tts` e `pdf`. Gli strumenti consentiti esplicitamente o necessari per la consegna rimangono disponibili, sebbene Tool Search possa inserirli nel catalogo invece di esporli direttamente. La modalità snella imposta inoltre per impostazione predefinita i cataloghi di plugin/MCP/client sulla Tool Search strutturata (`tool_search`, `tool_describe`, `tool_call`) quando `tools.toolSearch` non è già configurato. Usa `agents.list[].experimental.localModelLean` per limitarla a un solo agente.

Se hai già configurato Tool Search a livello globale, OpenClaw lascia invariata tale configurazione. Imposta `tools.toolSearch: false` per disattivare l'impostazione predefinita di Tool Search della modalità snella.

Nella modalità `tools` strutturata, le esecuzioni snelle mantengono `exec` direttamente visibile accanto ai controlli di Tool Search, in modo che i modelli locali ottimizzati per la programmazione possano continuare a scegliere il consueto percorso tramite shell. Ciò modifica soltanto la visibilità dello schema: continuano ad applicarsi i normali criteri degli strumenti, l'isolamento in sandbox e le approvazioni per l'esecuzione. Le modalità esplicite `code` e `directory` mantengono il normale comportamento di Compaction.

### Perché questi strumenti

Questi strumenti presentano le descrizioni più lunghe, le strutture dei parametri più ampie o la maggiore probabilità di distrarre un modello piccolo dal normale flusso di programmazione e conversazione. Su un backend con contesto ridotto o compatibile con OpenAI ma più rigoroso, ciò determina la differenza tra:

- Gli schemi degli strumenti che rientrano nel prompt e quelli che sottraggono spazio alla cronologia della conversazione.
- Il modello che seleziona lo strumento corretto e quello che genera chiamate agli strumenti non valide a causa di troppi schemi simili.
- L'adattatore Chat Completions che rimane entro i limiti dell'output strutturato e un errore 400 dovuto alle dimensioni del payload della chiamata allo strumento.

La loro rimozione abbrevia soltanto l'elenco diretto degli strumenti. Il modello continua a disporre di `read`, `write`, `edit`, `exec`, `apply_patch`, comprensione delle immagini, ricerca e recupero dal web (se configurati), memoria e strumenti per sessioni/agenti. I cataloghi aggiuntivi rimangono accessibili tramite Tool Search, a meno che non imposti `tools.toolSearch: false`; le autorizzazioni esplicite degli strumenti possono reintegrare un agente in modalità snella in un flusso di lavoro ridotto.

### Quando attivarla

Abilita la modalità snella dopo aver verificato che il modello riesca a comunicare con il Gateway, ma che i turni completi dell'agente presentino problemi:

1. `openclaw infer model run --gateway --model <ref> --prompt "Reply with exactly: pong"` ha esito positivo.
2. Un normale turno dell'agente non riesce a causa di chiamate agli strumenti non valide, prompt troppo grandi o perché il modello ignora i propri strumenti.
3. L'attivazione di `localModelLean: true` elimina l'errore.

### Quando lasciarla disattivata

Se il backend gestisce correttamente l'intero runtime predefinito, lascia disattivata questa opzione. È una soluzione alternativa per gli stack locali che richiedono una superficie degli strumenti più ridotta, non un'impostazione predefinita per i modelli ospitati o per le configurazioni locali dotate di risorse adeguate.

La modalità snella non sostituisce `tools.profile`, `tools.allow`/`tools.deny` né l'opzione di ripiego `compat.supportsTools: false` del modello. Per una superficie degli strumenti permanentemente più ristretta su un agente specifico, preferisci queste opzioni stabili.

### Abilitazione

```json5
{
  agents: {
    defaults: {
      experimental: {
        localModelLean: true,
      },
    },
  },
}
```

Solo per un agente:

```json5
{
  agents: {
    list: [
      {
        id: "local",
        model: "lmstudio/gemma-4-e4b-it",
        experimental: {
          localModelLean: true,
        },
      },
    ],
  },
}
```

Riavvia il Gateway dopo aver modificato il flag. Il filtraggio della modalità snella rimuove `browser`, `cron`, `message`, `image_generate`, `music_generate`, `video_generate`, `tts` e `pdf`, a meno che non li mantenga esplicitamente con `tools.allow` o `tools.alsoAllow`; Tool Search potrebbe comunque inserire gli strumenti mantenuti nel catalogo anziché esporli direttamente.

## Sperimentale non significa nascosto

Una funzionalità sperimentale deve essere indicata chiaramente come tale nella documentazione e nello stesso percorso di configurazione, senza essere nascosta dietro un'opzione predefinita dall'apparenza stabile.

## Contenuti correlati

- [Funzionalità](/it/concepts/features)
- [Canali di rilascio](/it/install/development-channels)
