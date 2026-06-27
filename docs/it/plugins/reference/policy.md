---
read_when:
    - Stai installando, configurando o verificando il Plugin delle policy
summary: Aggiunge controlli doctor basati su policy per la conformità del workspace.
title: Plugin dei criteri
x-i18n:
    generated_at: "2026-06-27T17:58:30Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f01de4816a191a175367c06ff69e4ebf6032ee1a105d1d9a48a74093e5e6f774
    source_path: plugins/reference/policy.md
    workflow: 16
---

# Plugin policy

Aggiunge controlli doctor basati su policy per la conformità del workspace.

## Distribuzione

- Pacchetto: `@openclaw/policy`
- Percorso di installazione: incluso in OpenClaw

## Superficie

plugin

<!-- openclaw-plugin-reference:manual-start -->

## Comportamento

Il Plugin Policy contribuisce controlli di integrità doctor per le impostazioni OpenClaw
gestite da policy e per le dichiarazioni del workspace governate. Attualmente Policy copre la
conformità dei canali, i metadati degli strumenti governati, la postura dei server MCP, la postura dei provider di modelli,
la postura di accesso alla rete privata, la postura di esposizione del Gateway, la postura del workspace/degli strumenti dell’agente, la postura configurata degli strumenti globali/per agente, la postura configurata del runtime sandbox, la postura di accesso ingress/canale, la postura di gestione dei dati e la postura del provider di segreti/profilo di autenticazione della configurazione di OpenClaw.

Policy archivia i requisiti creati in `policy.jsonc`, osserva le impostazioni OpenClaw
e le dichiarazioni del workspace esistenti come evidenza e segnala la deriva
tramite `openclaw policy check` e `openclaw doctor --lint`. Un controllo policy
pulito emette policy, evidenze, risultati e hash di attestazione che gli operatori
possono registrare per audit.

`openclaw policy compare --baseline <file>` confronta un file policy con un altro
file policy. È solo conformità a livello di configurazione: usa i metadati delle regole policy
per verificare che alla policy controllata non manchi nulla e che non sia più debole della baseline
creata, e non ispeziona lo stato del runtime, le credenziali o i valori segreti.

Le regole di postura degli strumenti possono richiedere profili approvati, strumenti filesystem
solo per workspace, impostazioni di sicurezza/richiesta/host exec limitate, modalità elevata disabilitata, voci
`alsoAllow` esatte e voci di negazione strumenti richieste. I record di evidenza
registrano voci `alsoAllow` additive perché possono ampliare la postura effettiva degli strumenti.
Questi controlli osservano solo la conformità della configurazione; non leggono lo stato di approvazione del runtime
né aggiungono enforcement del runtime.

Le regole di postura sandbox possono richiedere modalità/backend sandbox approvati, negare il networking
host dei container, negare join di namespace dei container, richiedere mount dei container in sola lettura,
negare mount dei socket del runtime container e profili container non confinati,
e richiedere intervalli sorgente CDP del browser sandbox.
Questi controlli osservano solo la conformità della configurazione; non leggono lo stato di approvazione del runtime,
non ispezionano container live né aggiungono enforcement del runtime.

Le regole di gestione dei dati possono richiedere la redazione del logging sensibile, negare l’acquisizione
di contenuti telemetrici, richiedere la manutenzione della conservazione delle sessioni e negare
l’indicizzazione in memoria delle trascrizioni di sessione. Questi controlli osservano solo la conformità della configurazione;
non ispezionano log grezzi, esportazioni telemetriche, trascrizioni, file di memoria, segreti
o dati personali.

Gli scope policy denominati in `scopes.<scopeName>` possono aggiungere sezioni policy normali più rigorose
per il selettore che elencano. `agentIds` supporta `tools`,
`agents.workspace`, `sandbox` e `dataHandling.memory`; `channelIds` supporta
`ingress.channels`.
Gli ID agente runtime che non sono elencati esplicitamente in `agents.list[]` vengono controllati
rispetto alla postura globale/predefinita ereditata invece di passare silenziosamente senza
evidenza. Ogni scope presente in `policy.jsonc` deve essere valido e applicabile
per il proprio selettore. Le regole overlay sono dichiarazioni aggiuntive, quindi non indeboliscono
la policy di livello superiore e possono produrre risultati propri quando la stessa configurazione
osservata viola entrambi gli scope.

<!-- openclaw-plugin-reference:manual-end -->

## Documentazione correlata

- [policy](/it/cli/policy)
