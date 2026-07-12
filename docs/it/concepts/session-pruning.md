---
read_when:
    - Vuoi ridurre l'aumento del contesto causato dagli output degli strumenti
    - Vuoi comprendere l'ottimizzazione della cache dei prompt di Anthropic
summary: Eliminazione dei vecchi risultati degli strumenti per mantenere il contesto snello e la cache efficiente
title: Potatura della sessione
x-i18n:
    generated_at: "2026-07-12T07:00:35Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: dd5cb4582cb8d9d7265213abe1f5b5893634882b9f8b3ce1deef746293dd07db
    source_path: concepts/session-pruning.md
    workflow: 16
---

La potatura della sessione riduce i **risultati meno recenti degli strumenti** nel contesto prima di ogni chiamata al modello LLM. Limita l'espansione del contesto causata dall'accumulo degli output degli strumenti (risultati di esecuzione, letture di file, risultati di ricerca) senza riscrivere il normale testo della conversazione.

<Info>
La potatura avviene solo in memoria e non modifica la trascrizione della sessione su disco. La cronologia completa viene sempre conservata.
</Info>

## Perché è importante

Le sessioni lunghe accumulano output degli strumenti che ampliano la finestra di contesto. Ciò aumenta i costi e può rendere necessaria la [Compaction](/it/concepts/compaction) prima del previsto.

La potatura è particolarmente utile per la **memorizzazione nella cache dei prompt di Anthropic**. Dopo la scadenza del TTL della cache, la richiesta successiva memorizza nuovamente nella cache l'intero prompt. La potatura riduce le dimensioni dei dati scritti nella cache, abbassando direttamente i costi.

## Come funziona

La potatura viene eseguita in modalità `cache-ttl` ed è subordinata sia a un controllo temporale sia a un controllo delle dimensioni del contesto:

1. Attende la scadenza del TTL della cache (valore predefinito di 5 minuti quando impostato manualmente; per il valore predefinito automatico di Anthropic, vedere [Valori predefiniti intelligenti](#smart-defaults)). Prima che il TTL sia trascorso, la potatura viene completamente ignorata per preservare il riutilizzo della cache dei prompt nei turni ravvicinati.
2. Una volta trascorso il TTL, stima le dimensioni totali del contesto rispetto alla finestra di contesto del modello. Se il rapporto è inferiore a `softTrimRatio` (valore predefinito 0,3), ignora la potatura e lascia attivo il conteggio del TTL.
3. **Riduce parzialmente** i risultati degli strumenti sovradimensionati che superano il rapporto: conserva l'inizio e la fine (per impostazione predefinita 1.500 caratteri ciascuno, con un limite complessivo di 4.000 caratteri) e inserisce `...` tra le due parti.
4. Se il rapporto è ancora pari o superiore a `hardClearRatio` (valore predefinito 0,5) e rimangono almeno `minPrunableToolChars` (valore predefinito 50.000) caratteri di contenuto degli strumenti eliminabile, **cancella completamente** tali risultati: ne sostituisce il contenuto con un segnaposto (valore predefinito `[Contenuto del risultato precedente dello strumento cancellato]`).
5. Azzera il conteggio del TTL solo quando la potatura ha effettivamente modificato il contesto, in modo che le richieste successive riutilizzino la cache appena creata.

Indipendentemente dalle soglie, si applicano due regole di sicurezza: i `keepLastAssistants` turni più recenti dell'assistente (valore predefinito 3) non vengono mai potati e nulla di quanto precede il primo messaggio dell'utente nella sessione viene mai potato (ciò protegge le letture di inizializzazione come `SOUL.md`/`USER.md`).

Solo i messaggi `toolResult` sono idonei; il normale testo della conversazione non viene modificato. Usa `agents.defaults.contextPruning.tools.{allow,deny}` per definire quali nomi di strumenti possono essere potati.

## Pulizia delle immagini obsolete

OpenClaw crea inoltre una vista di riproduzione separata e idempotente per le sessioni che conservano nella cronologia blocchi di immagini non elaborati o marcatori multimediali per l'inizializzazione dei prompt.

- Conserva **i 3 turni completati più recenti** byte per byte, affinché i prefissi della cache dei prompt rimangano stabili per le richieste successive recenti. Il conteggio include tutti i turni completati, non solo quelli contenenti immagini, quindi anche i turni di solo testo occupano la finestra.
- Nella vista di riproduzione, i blocchi di immagini meno recenti e già elaborati nella cronologia di `user` o `toolResult` vengono sostituiti con `[dati dell'immagine rimossi - già elaborati dal modello]`.
- I riferimenti testuali meno recenti ai contenuti multimediali, come `[contenuto multimediale allegato: ...]`, `[Immagine: origine: ...]` e `media://inbound/...`, vengono sostituiti con `[riferimento al contenuto multimediale rimosso - già elaborato dal modello]`. I marcatori degli allegati del turno corrente rimangono intatti, affinché i modelli visivi possano ancora caricare le nuove immagini.
- La trascrizione non elaborata della sessione non viene riscritta, quindi i visualizzatori della cronologia possono continuare a mostrare le voci originali dei messaggi e le relative immagini.
- Questa operazione è distinta dalla normale potatura basata sul TTL della cache descritta sopra. Serve a impedire che payload di immagini ripetuti o riferimenti multimediali obsoleti invalidino le cache dei prompt nei turni successivi.

## Valori predefiniti intelligenti

Il Plugin Anthropic incluso configura automaticamente la potatura e la frequenza dell'Heartbeat la prima volta che risolve un profilo di autenticazione Anthropic (o Claude CLI), ma solo per i campi che non sono già stati impostati esplicitamente:

| Modalità di autenticazione                         | `contextPruning.mode` | `contextPruning.ttl` | `heartbeat.every` |
| -------------------------------------------------- | --------------------- | -------------------- | ----------------- |
| OAuth/token (incluso il riutilizzo di Claude CLI)  | `cache-ttl`           | `1h`                 | `1h`              |
| Chiave API                                         | `cache-ttl`           | `1h`                 | `30m`             |

Se imposti autonomamente `agents.defaults.contextPruning.mode` o `agents.defaults.heartbeat.every`, OpenClaw non li sovrascrive. Questo valore predefinito automatico si applica solo all'autenticazione della famiglia Anthropic; per gli altri fornitori la potatura è `off`, a meno che non venga configurata.

## Attivazione o disattivazione

La potatura è disattivata per impostazione predefinita per i fornitori diversi da Anthropic. Per attivarla:

```json5
{
  agents: {
    defaults: {
      contextPruning: { mode: "cache-ttl", ttl: "5m" },
    },
  },
}
```

Per disattivarla: imposta `mode: "off"`.

## Potatura e Compaction

|              | Potatura                       | Compaction                  |
| ------------ | ------------------------------ | --------------------------- |
| **Azione**   | Riduce i risultati degli strumenti | Riassume la conversazione |
| **Salvata?** | No (per ogni richiesta)        | Sì (nella trascrizione)     |
| **Ambito**   | Solo risultati degli strumenti | Intera conversazione        |

Si completano a vicenda: la potatura mantiene snelli gli output degli strumenti tra un ciclo di Compaction e l'altro.

## Ulteriori letture

- [Compaction](/it/concepts/compaction): riduzione del contesto basata sulla sintesi
- [Configurazione del Gateway](/it/gateway/configuration): tutte le opzioni di configurazione della potatura (`contextPruning.*`)

## Contenuti correlati

- [Gestione delle sessioni](/it/concepts/session)
- [Strumenti di sessione](/it/concepts/session-tool)
- [Motore del contesto](/it/concepts/context-engine)
