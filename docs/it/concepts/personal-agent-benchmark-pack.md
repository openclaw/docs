---
read_when:
    - Esecuzione dei controlli di affidabilità dell'agente personale locale
    - Estensione del catalogo degli scenari di QA basato sul repository
    - Verifica di promemoria, risposte, memoria, oscuramento, prosecuzione sicura con gli strumenti, stato delle attività, diagnostica condivisibile in sicurezza, dichiarazioni di completamento supportate da prove e ripristino dagli errori
summary: Scenari qa-channel locali per verifiche dei flussi di lavoro dell'assistente personale rispettose della privacy.
title: Pacchetto di benchmark per agenti personali
x-i18n:
    generated_at: "2026-07-12T06:58:00Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 35da45e4b22b1044a777fa8d6bce87f9ace377950dd0af3f2419b40cfe4d9be6
    source_path: concepts/personal-agent-benchmark-pack.md
    workflow: 16
---

Il Personal Agent Benchmark Pack è un piccolo pacchetto di scenari di QA supportato da un repository per i flussi di lavoro degli assistenti personali
locali. Non è un benchmark generico per modelli e
non richiede un nuovo esecutore: riutilizza lo stack QA privato ([panoramica della QA](/it/concepts/qa-e2e-automation)),
il [canale QA](/it/channels/qa-channel) sintetico e il catalogo YAML
`qa/scenarios` esistente.

## Scenari

Dieci scenari, definiti in `qa/scenarios/personal/*.yaml`:

| ID scenario                                | Verifiche                                                                                                  |
| ------------------------------------------ | ---------------------------------------------------------------------------------------------------------- |
| `personal-reminder-roundtrip`              | Promemoria personali fittizi tramite recapito Cron locale                                                  |
| `personal-channel-thread-reply`            | Instradamento fittizio di messaggi diretti e risposte nei thread tramite `qa-channel`                       |
| `personal-memory-preference-recall`        | Recupero fittizio delle preferenze dai file di memoria dell'area di lavoro QA temporanea                    |
| `personal-redaction-no-secret-leak`        | Verifiche fittizie che i segreti non vengano ripetuti                                                       |
| `personal-tool-safety-followthrough`       | Completamento sicuro basato su uno strumento di lettura dopo un breve turno simile a un'approvazione        |
| `personal-approval-denial-stop`            | Comportamento di arresto dopo il rifiuto dell'approvazione per una richiesta sensibile di lettura locale    |
| `personal-task-followthrough-status`       | Segnalazione dello stato delle attività basata su prove, che mantiene separati gli stati in sospeso, bloccato e completato |
| `personal-share-safe-diagnostics-artifact` | Artefatti diagnostici sicuri da condividere che mantengono informazioni di stato utili omettendo i contenuti personali non elaborati |
| `personal-no-fake-progress`                | Dichiarazioni di completamento basate su prove che evitano di indicare falsi progressi prima che esistano prove locali |
| `personal-failure-recovery`                | Ripristino dopo un errore che segnala lo stato parziale e mantiene chiari i limiti dei nuovi tentativi      |

I metadati del pacchetto leggibili dalla macchina (elenco degli ID, titolo e descrizione) si trovano in
`extensions/qa-lab/src/scenario-packs.ts` come `QA_PERSONAL_AGENT_SCENARIO_IDS`.
Esegui il pacchetto con `--pack personal-agent`:

```bash
OPENCLAW_ENABLE_PRIVATE_QA_CLI=1 pnpm openclaw qa suite \
  --provider-mode mock-openai \
  --pack personal-agent \
  --concurrency 1
```

`--pack` si combina con flag `--scenario` ripetuti. Gli scenari espliciti vengono eseguiti
per primi, quindi gli scenari del pacchetto vengono eseguiti nell'ordine di `QA_PERSONAL_AGENT_SCENARIO_IDS`,
rimuovendo i duplicati.

Il pacchetto è destinato a `qa-channel` con `mock-openai` o un'altra corsia locale di provider
QA. Non indirizzarlo verso servizi di chat attivi o account personali reali.

## Modello di privacy

Gli scenari usano esclusivamente utenti fittizi, preferenze fittizie, segreti fittizi e l'area di lavoro
temporanea del Gateway QA creata dalla suite. Non devono leggere né
scrivere la memoria, le sessioni, le credenziali, gli agenti di avvio, le configurazioni
globali o lo stato attivo del Gateway di utenti OpenClaw reali.

Gli artefatti rimangono nella directory degli artefatti della suite QA esistente e vengono trattati
come output dei test. Le verifiche di oscuramento usano marcatori fittizi, in modo che gli errori possano essere
esaminati e segnalati in modo sicuro nelle issue.

## Estensione del pacchetto

Aggiungi nuovi casi `.yaml` in `qa/scenarios/personal/`, quindi aggiungi l'ID dello scenario
a `QA_PERSONAL_AGENT_SCENARIO_IDS`. Mantieni ogni caso piccolo, locale, deterministico
in `mock-openai` e incentrato su un singolo comportamento dell'assistente personale.

Buoni candidati per sviluppi successivi: verifiche dell'esportazione oscurata delle traiettorie, verifiche dei flussi di lavoro
dei Plugin esclusivamente locali.

Evita di aggiungere un nuovo esecutore, Plugin, dipendenza, trasporto attivo o valutatore basato su modello
finché il catalogo degli scenari non contiene abbastanza casi stabili da giustificare tale superficie.
