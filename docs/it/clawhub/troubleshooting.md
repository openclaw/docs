---
read_when:
    - I comandi della CLI di ClawHub o del registro OpenClaw falliscono
    - Un pacchetto non può essere installato, pubblicato o aggiornato
summary: Risoluzione dei problemi relativi ad accesso, installazione, pubblicazione, sincronizzazione, aggiornamento e API di ClawHub.
x-i18n:
    generated_at: "2026-05-13T04:18:48Z"
    model: gpt-5.5
    provider: openai
    source_hash: 3e23936085ebc5422d71df8a9feffbbe56ce562de8d203462d712cc58f88a0ed
    source_path: clawhub/troubleshooting.md
    workflow: 16
---

# Risoluzione dei problemi

## `clawhub login` apre un browser ma non si completa mai

La CLI avvia un server di callback locale di breve durata durante l'accesso dal browser.

- Assicurati che il browser possa raggiungere `http://127.0.0.1:<port>/callback`.
- Controlla le regole del firewall locale, della VPN e del proxy se la callback non arriva mai.
- Negli ambienti headless, crea un token API nell'interfaccia web di ClawHub ed esegui:

```bash
clawhub login --token clh_...
```

## `whoami` o `publish` restituisce `Unauthorized` (401)

- Accedi di nuovo con `clawhub login`.
- Se usi un percorso di configurazione personalizzato, verifica che `CLAWHUB_CONFIG_PATH` punti al
  file che contiene il tuo token attuale.
- Se usi un token API, verifica che non sia stato revocato nell'interfaccia web.

## La ricerca o l'installazione restituisce `Rate limit exceeded` (429)

Leggi le informazioni di retry nella risposta:

- `Retry-After`: secondi da attendere prima di riprovare.
- `RateLimit-Remaining` e `RateLimit-Limit`: il budget attuale.
- `RateLimit-Reset` o `X-RateLimit-Reset`: tempistica di reset.

Se molti utenti condividono un unico IP di uscita, i limiti per IP anonimo possono essere raggiunti anche quando ogni
persona invia solo poche richieste. Accedi dove possibile e riprova dopo il
ritardo indicato.

## La ricerca o l'installazione non riesce dietro un proxy

La CLI rispetta le variabili proxy standard:

```bash
export HTTPS_PROXY=http://proxy.example.com:3128
clawhub search "my query"
```

I nomi supportati includono `HTTPS_PROXY`, `HTTP_PROXY`, `https_proxy` e
`http_proxy`.

## Uno skill non appare nella ricerca

- Controlla lo slug esatto o la pagina del proprietario se la conosci.
- Verifica che la release sia pubblica e non bloccata da scansione o moderazione.
- Se sei il proprietario dello skill, accedi e ispezionalo:

```bash
clawhub inspect <skill-slug>
```

La diagnostica visibile al proprietario può spiegare lo stato di scansione, gate di caricamento o moderazione.

## La pubblicazione non riesce perché mancano metadati obbligatori

Per gli skill, controlla il frontmatter di `SKILL.md`. Le variabili di ambiente e gli
strumenti richiesti devono essere dichiarati in modo che utenti e scanner possano comprendere il pacchetto.

Per i Plugin, controlla i metadati di compatibilità in `package.json`. Le pubblicazioni di code-plugin
richiedono campi di compatibilità OpenClaw come `openclaw.compat.pluginApi` e
`openclaw.build.openclawVersion`.

Visualizza prima l'anteprima del payload di pubblicazione:

```bash
clawhub package publish <source> --family code-plugin --dry-run
```

## La pubblicazione non riesce con un errore relativo al proprietario GitHub o alla sorgente

ClawHub usa l'identità GitHub e l'attribuzione della sorgente per collegare i pacchetti ai rispettivi
publisher.

- Assicurati di aver effettuato l'accesso con l'account GitHub che possiede o può pubblicare
  il pacchetto.
- Controlla che l'URL sorgente sia pubblico o accessibile a ClawHub.
- Per le sorgenti GitHub, usa `owner/repo`, `owner/repo@ref` o un URL GitHub completo.

## `sync` dice che non sono stati trovati skill

`sync` cerca cartelle che contengono `SKILL.md` o `skill.md`.

Puntalo alle root che vuoi analizzare:

```bash
clawhub sync --root /path/to/skills
```

Visualizza prima l'anteprima se non sei sicuro di cosa verrà pubblicato:

```bash
clawhub sync --all --dry-run --no-input
```

## `update` rifiuta l'operazione a causa di modifiche locali

I file locali non corrispondono ad alcuna versione nota a ClawHub. Scegli una delle opzioni:

- Mantieni le modifiche locali e salta l'aggiornamento.
- Sovrascrivi con la versione pubblicata:

```bash
clawhub update <slug> --force
```

- Pubblica la copia modificata come nuovo slug o fork.

## L'installazione di un Plugin non riesce in OpenClaw

- Usa una sorgente ClawHub esplicita:

```bash
openclaw plugins install clawhub:<package>
```

- Controlla la pagina dei dettagli del pacchetto per lo stato della scansione e i metadati di compatibilità.
- Verifica che la tua versione di OpenClaw soddisfi l'intervallo di compatibilità
  dichiarato dal pacchetto.
- Se il pacchetto è nascosto, bloccato o respinto, potrebbe non essere installabile finché
  il proprietario non risolve il problema.

## Le richieste API pubbliche non riescono

- Rispetta gli header di retry `429` e memorizza nella cache le risposte pubbliche di elenco/ricerca.
- Rimanda gli utenti alla scheda ClawHub canonica.
- Non replicare contenuti nascosti, privati, bloccati o bloccati dalla moderazione al di fuori della
  superficie API pubblica.

Vedi [API HTTP](/it/clawhub/http-api) per i dettagli degli endpoint.
