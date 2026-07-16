---
read_when:
    - È necessario trovare qualcosa di cui si è discusso in una sessione precedente
    - Si desidera comprendere la privacy o l’indicizzazione della ricerca nelle sessioni
summary: Cerca nelle trascrizioni delle sessioni precedenti e riapri il contesto corrispondente
title: Ricerca nelle sessioni
x-i18n:
    generated_at: "2026-07-16T14:10:00Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 3e9cda6b656b689eef0636592914f4890a64dca5e955aa03908377903aaa29c9
    source_path: concepts/session-search.md
    workflow: 16
---

# Ricerca nelle sessioni

`sessions_search` cerca nel testo dell'utente e dell'assistente delle proprie sessioni passate. Ogni risultato
include un `sessionKey`, un timestamp, un ruolo e un breve estratto corrispondente. Passare il valore
`sessionKey` restituito a `sessions_history` quando è necessario il contesto della conversazione.

## Visibilità e output

La ricerca usa le stesse regole di visibilità delle sessioni di `sessions_history`. I risultati al di fuori
dell'albero delle sessioni visibile al chiamante vengono rimossi prima di applicare i limiti ai risultati.
Gli agenti in sandbox rimangono limitati alle sessioni che hanno generato quando la visibilità delle
sessioni generate è abilitata.

Gli estratti vengono oscurati prima di essere restituiti al modello. I risultati sono inoltre limitati per numero,
lunghezza degli estratti e dimensione totale della risposta.

## Ciclo di vita dell'indice

OpenClaw archivia un indice full-text accanto alle righe delle trascrizioni nel database SQLite di ciascun agente.
I nuovi messaggi dell'utente e dell'assistente vengono indicizzati nella stessa transazione che li rende persistenti,
quindi l'indice non rimane mai indietro rispetto alle conversazioni attive; i risultati degli strumenti, i blocchi
di ragionamento e le immagini sono esclusi. È ricercabile solo il ramo attivo della trascrizione.

Le trascrizioni precedenti alla creazione dell'indice (ad esempio, le sessioni importate da `openclaw doctor`) e
le sessioni il cui ramo attivo è stato riavvolto vengono reindicizzate tramite una riconciliazione in background che
inizia con la ricerca successiva. Una risposta con `indexing: true` può quindi essere incompleta; riprovare al
termine dell'indicizzazione. L'eliminazione di una sessione rimuove le relative voci dall'indice nella stessa transazione.

Attualmente la ricerca usa il tokenizzatore di parole Unicode di SQLite con rimozione dei segni diacritici. La
tokenizzazione tramite trigrammi per la corrispondenza di sottostringhe CJK è un miglioramento futuro.

## Ricerca nelle sessioni e ricerca nella memoria

Usare `sessions_search` per parole o frasi esatte tratte dalle trascrizioni non elaborate delle sessioni. Usare
[`memory_search`](/it/concepts/memory-search) per i file di memoria persistenti e il richiamo semantico. Il
corpus sperimentale della memoria delle sessioni è il complemento semantico di questa ricerca esatta nelle trascrizioni.
