---
read_when:
    - I comandi della CLI di ClawHub o del registro di OpenClaw non riescono
    - Non è possibile installare, pubblicare o aggiornare un pacchetto
summary: Risoluzione dei problemi relativi all'accesso a ClawHub, all'installazione, alla pubblicazione, alla sincronizzazione, all'aggiornamento e alle API.
x-i18n:
    generated_at: "2026-05-12T15:43:05Z"
    model: gpt-5.5
    provider: openai
    source_hash: 3e23936085ebc5422d71df8a9feffbbe56ce562de8d203462d712cc58f88a0ed
    source_path: clawhub/troubleshooting.md
    workflow: 16
---

# Risoluzione dei problemi

## `clawhub login` apre un browser ma non viene mai completato

La CLI avvia un server locale di callback di breve durata durante l'accesso tramite browser.

- Assicurati che il browser possa raggiungere `http://127.0.0.1:<port>/callback`.
- Controlla le regole del firewall locale, della VPN e del proxy se la callback non arriva mai.
- Negli ambienti senza interfaccia grafica, crea un token API nella UI web di ClawHub ed esegui:

```bash
clawhub login --token clh_...
```

## `whoami` o `publish` restituisce `Unauthorized` (401)

- Accedi di nuovo con `clawhub login`.
- Se usi un percorso di configurazione personalizzato, verifica che `CLAWHUB_CONFIG_PATH` punti al
  file che contiene il tuo token attuale.
- Se usi un token API, verifica che non sia stato revocato nella UI web.

## La ricerca o l'installazione restituisce `Rate limit exceeded` (429)

Leggi le informazioni sui tentativi nella risposta:

- `Retry-After`: secondi da attendere prima di riprovare.
- `RateLimit-Remaining` e `RateLimit-Limit`: il tuo budget attuale.
- `RateLimit-Reset` o `X-RateLimit-Reset`: tempistica di ripristino.

Se molti utenti condividono un unico IP in uscita, i limiti IP anonimi possono essere raggiunti anche quando ogni
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

## Uno skill non compare nella ricerca

- Controlla lo slug esatto o la pagina del proprietario, se la conosci.
- Verifica che la release sia pubblica e non bloccata da scansione o moderazione.
- Se possiedi lo skill, accedi e ispezionalo:

```bash
clawhub inspect <skill-slug>
```

La diagnostica visibile al proprietario può spiegare lo stato di scansione, blocco del caricamento o moderazione.

## La pubblicazione non riesce perché mancano metadati obbligatori

Per gli skill, controlla il frontmatter di `SKILL.md`. Le variabili d'ambiente e gli
strumenti obbligatori devono essere dichiarati in modo che utenti e scanner possano comprendere il pacchetto.

Per i Plugin, controlla i metadati di compatibilità in `package.json`. Le pubblicazioni di Plugin di codice
richiedono campi di compatibilità OpenClaw come `openclaw.compat.pluginApi` e
`openclaw.build.openclawVersion`.

Visualizza prima in anteprima il payload di pubblicazione:

```bash
clawhub package publish <source> --family code-plugin --dry-run
```

## La pubblicazione non riesce con un errore relativo al proprietario GitHub o alla sorgente

ClawHub usa l'identità GitHub e l'attribuzione della sorgente per collegare i pacchetti ai loro
editori.

- Assicurati di aver effettuato l'accesso con l'account GitHub che possiede o può pubblicare
  il pacchetto.
- Controlla che l'URL sorgente sia pubblico o accessibile a ClawHub.
- Per le sorgenti GitHub, usa `owner/repo`, `owner/repo@ref` o un URL GitHub completo.

## `sync` dice che non sono stati trovati skill

`sync` cerca cartelle contenenti `SKILL.md` o `skill.md`.

Puntalo alle radici che vuoi analizzare:

```bash
clawhub sync --root /path/to/skills
```

Visualizza prima un'anteprima se non sei sicuro di cosa verrà pubblicato:

```bash
clawhub sync --all --dry-run --no-input
```

## `update` rifiuta l'operazione a causa di modifiche locali

I file locali non corrispondono ad alcuna versione nota a ClawHub. Scegli un'opzione:

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

- Controlla la pagina dei dettagli del pacchetto per lo stato di scansione e i metadati di compatibilità.
- Verifica che la tua versione di OpenClaw soddisfi l'intervallo di compatibilità
  dichiarato dal pacchetto.
- Se il pacchetto è nascosto, bloccato in attesa o bloccato, potrebbe non essere installabile finché
  il proprietario non risolve il problema.

## Le richieste all'API pubblica non riescono

- Rispetta gli header di nuovo tentativo `429` e memorizza nella cache le risposte pubbliche di elenco/ricerca.
- Rimanda gli utenti alla scheda ClawHub canonica.
- Non duplicare contenuti nascosti, privati, bloccati in attesa o bloccati dalla moderazione al di fuori della
  superficie dell'API pubblica.

Consulta [API HTTP](/it/clawhub/http-api) per i dettagli sugli endpoint.
