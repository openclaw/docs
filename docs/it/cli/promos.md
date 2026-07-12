---
read_when:
    - Vuoi provare un'offerta promozionale gratuita per un modello di ClawHub
    - Stai configurando un provider tramite una promozione anziché mediante la procedura di onboarding
summary: Riferimento della CLI per `openclaw promos` (elencare e richiedere le offerte promozionali dei modelli)
title: Promozioni
x-i18n:
    generated_at: "2026-07-12T06:57:52Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 779eab2e9500b7376fabf9accb333e83ff5f84b085d51b7d551b5507b1e73adb
    source_path: cli/promos.md
    workflow: 16
---

# `openclaw promos`

Scopri e richiedi le offerte promozionali sui modelli pubblicate su ClawHub. La richiesta di una promozione configura il provider (autenticazione e Plugin, quando necessario) e registra i modelli della promozione, senza eseguire nuovamente la procedura di configurazione iniziale e senza modificare il modello predefinito, a meno che tu non lo richieda.

Argomenti correlati:

- Modello predefinito e modelli di riserva: [Modelli](/it/cli/models)
- Configurazione dell'autenticazione del provider: [Guida introduttiva](/it/start/getting-started)

## Comandi

```bash
openclaw promos list
openclaw promos claim <slug>
openclaw promos claim <slug> --api-key <key> --set-default
```

## `openclaw promos list`

Elenca le promozioni attualmente attive, con i relativi modelli, il modello predefinito suggerito, il tempo rimanente e il comando esatto per richiederle. `--json` stampa il payload non elaborato.

## `openclaw promos claim <slug>`

Richiede una promozione attiva:

1. Recupera la promozione da ClawHub e verifica che rientri nel periodo di validità.
2. Convalida il provider della promozione, il metodo di autenticazione e i pacchetti Plugin dichiarati rispetto alla versione di OpenClaw installata. Gli ID sconosciuti o le discrepanze tra i pacchetti vengono rifiutati: una promozione non può mai indurre la CLI a eseguire operazioni che non sa già come effettuare.
3. Riutilizza le credenziali esistenti del provider, se disponibili. In caso contrario, avvia il normale flusso di autenticazione del provider, mostrando prima l'URL di registrazione della promozione per ottenere una chiave gratuita. `--api-key <key>` completa l'autenticazione tramite chiave API senza richieste interattive, in modo coerente con le opzioni non interattive di `openclaw onboard`; per evitare di inserire la chiave nella riga di comando, esporta invece la variabile di ambiente del provider, ad esempio `OPENROUTER_API_KEY`: le credenziali già presenti nell'ambiente vengono rilevate automaticamente e non è necessaria alcuna opzione.
4. Registra i modelli della promozione con i relativi alias. Gli alias esistenti non vengono mai sovrascritti.
5. Propone di impostare come predefinito il modello suggerito dalla promozione: `--set-default` salta la domanda; in caso contrario, le impostazioni predefinite non vengono modificate.

Al termine del periodo di validità della promozione, il provider interrompe l'erogazione dei modelli gratuiti; la configurazione e le credenziali rimangono invariate. Puoi cambiare nuovamente modello in qualsiasi momento con `openclaw models set <model>`.

## Individuazione passiva in `models list`

`openclaw models list` mostra anche le promozioni senza che sia necessario interrogare direttamente ClawHub:

- Le offerte attive i cui modelli non sono stati configurati vengono visualizzate in un gruppo "Disponibili tramite promozione" sotto la tabella, ciascuna con il relativo comando di richiesta.
- I modelli registrati tramite `promos claim` presentano un'etichetta `promo`, che diventa `promo ended` al termine del periodo di validità dell'offerta.
- La prima volta che viene rilevata una nuova offerta, un avviso visualizzato una sola volta rimanda a `openclaw promos list`. Le offerte già elencate o richieste non vengono più annunciate.

Questa funzionalità legge una copia memorizzata nella cache locale del feed delle promozioni ospitato da ClawHub, normalmente aggiornata una volta al giorno tramite una richiesta condizionale oppure prima, alla scadenza dell'istantanea memorizzata nella cache; gli errori di aggiornamento vengono ignorati senza avvisi. L'aggiornamento di una copia non più recente attende al massimo 2,5 secondi e non interrompe mai la visualizzazione dell'elenco. L'output di `--json` e `--plain` rimane adatto all'elaborazione automatica: non include sezioni o avvisi relativi alle promozioni. La richiesta di una promozione viene sempre riconvalidata tramite l'API ClawHub in tempo reale, pertanto un'offerta ritirata in anticipo viene rifiutata anche se è ancora visibile in una copia memorizzata nella cache.
