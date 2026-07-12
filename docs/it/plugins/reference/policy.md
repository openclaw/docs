---
read_when:
    - Stai installando, configurando o verificando il plugin dei criteri
summary: Aggiunge controlli doctor basati su criteri per verificare la conformità dello spazio di lavoro.
title: Plugin per le policy
x-i18n:
    generated_at: "2026-07-12T07:23:24Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f01de4816a191a175367c06ff69e4ebf6032ee1a105d1d9a48a74093e5e6f774
    source_path: plugins/reference/policy.md
    workflow: 16
---

# Plugin Policy

Aggiunge controlli doctor basati su policy per la conformità dello spazio di lavoro.

## Distribuzione

- Pacchetto: `@openclaw/policy`
- Modalità di installazione: incluso in OpenClaw

## Superficie

Plugin

<!-- openclaw-plugin-reference:manual-start -->

## Comportamento

Il Plugin Policy fornisce controlli di integrità doctor per le impostazioni di OpenClaw gestite tramite policy e le dichiarazioni regolamentate dello spazio di lavoro. Attualmente, Policy verifica la conformità dei canali, i metadati regolamentati degli strumenti, la configurazione di sicurezza dei server MCP, dei fornitori di modelli, dell'accesso alla rete privata, dell'esposizione del Gateway, dello spazio di lavoro e degli strumenti degli agenti, degli strumenti globali e per agente configurati, del runtime sandbox configurato, dell'accesso in ingresso e ai canali, della gestione dei dati e dei fornitori di segreti e profili di autenticazione della configurazione di OpenClaw.

Policy memorizza i requisiti definiti in `policy.jsonc`, considera come evidenze le impostazioni e le dichiarazioni dello spazio di lavoro OpenClaw esistenti e segnala gli scostamenti tramite `openclaw policy check` e `openclaw doctor --lint`. Un controllo della policy senza problemi produce la policy, le evidenze, i risultati e gli hash di attestazione che gli operatori possono registrare a fini di audit.

`openclaw policy compare --baseline <file>` confronta un file di policy con un altro file di policy. Verifica esclusivamente la conformità a livello di configurazione: utilizza i metadati delle regole della policy per verificare che la policy controllata non presenti requisiti mancanti o meno rigorosi rispetto alla baseline definita e non esamina lo stato del runtime, le credenziali o i valori dei segreti.

Le regole sulla configurazione di sicurezza degli strumenti possono richiedere profili approvati, strumenti del file system limitati allo spazio di lavoro, impostazioni circoscritte per sicurezza, richieste di conferma e host di exec, la modalità con privilegi elevati disabilitata, voci `alsoAllow` esatte e voci obbligatorie di esclusione degli strumenti. Le evidenze registrano le voci `alsoAllow` aggiuntive, poiché possono ampliare le autorizzazioni effettive degli strumenti. Questi controlli verificano esclusivamente la conformità della configurazione; non leggono lo stato delle approvazioni del runtime né aggiungono meccanismi di applicazione nel runtime.

Le regole sulla configurazione di sicurezza della sandbox possono richiedere modalità e backend sandbox approvati, vietare la rete host dei container, vietare l'accesso agli spazi dei nomi dei container, richiedere montaggi dei container in sola lettura, vietare i montaggi dei socket del runtime dei container e i profili dei container senza restrizioni e richiedere intervalli di origine CDP per il browser della sandbox. Questi controlli verificano esclusivamente la conformità della configurazione; non leggono lo stato delle approvazioni del runtime, non esaminano i container attivi né aggiungono meccanismi di applicazione nel runtime.

Le regole sulla gestione dei dati possono richiedere l'oscuramento delle informazioni sensibili nei log, vietare l'acquisizione di contenuti nella telemetria, richiedere la manutenzione della conservazione delle sessioni e vietare l'indicizzazione in memoria delle trascrizioni delle sessioni. Questi controlli verificano esclusivamente la conformità della configurazione; non esaminano i log non elaborati, le esportazioni di telemetria, le trascrizioni, i file di memoria, i segreti o i dati personali.

Gli ambiti di policy denominati in `scopes.<scopeName>` possono aggiungere sezioni di policy normali più rigorose per il selettore specificato. `agentIds` supporta `tools`, `agents.workspace`, `sandbox` e `dataHandling.memory`; `channelIds` supporta `ingress.channels`.
Gli ID degli agenti del runtime non elencati esplicitamente in `agents.list[]` vengono verificati rispetto alla configurazione di sicurezza globale o predefinita ereditata, anziché essere approvati implicitamente senza evidenze. Ogni ambito presente in `policy.jsonc` deve essere valido e applicabile al relativo selettore. Le regole di sovrapposizione costituiscono requisiti aggiuntivi, pertanto non indeboliscono la policy di primo livello e possono produrre risultati propri quando la stessa configurazione osservata viola entrambi gli ambiti.

<!-- openclaw-plugin-reference:manual-end -->

## Documentazione correlata

- [policy](/it/cli/policy)
