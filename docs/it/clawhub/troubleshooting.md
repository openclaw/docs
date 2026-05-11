---
read_when:
    - I comandi della CLI di ClawHub o del registro OpenClaw hanno esito negativo
    - Non è possibile installare, pubblicare o aggiornare un pacchetto
summary: Risoluzione dei problemi di accesso, installazione, pubblicazione, sincronizzazione, aggiornamento e API di ClawHub.
x-i18n:
    generated_at: "2026-05-11T20:24:52Z"
    model: gpt-5.5
    provider: openai
    source_hash: 3e23936085ebc5422d71df8a9feffbbe56ce562de8d203462d712cc58f88a0ed
    source_path: clawhub/troubleshooting.md
    workflow: 16
---

# Risoluzione dei problemi

## `clawhub login` apre un browser ma non viene mai completato

La CLI avvia un server di callback locale di breve durata durante l'accesso tramite browser.

- Assicurati che il browser possa raggiungere `http://127.0.0.1:<port>/callback`.
- Controlla le regole di firewall locale, VPN e proxy se la callback non arriva mai.
- Negli ambienti headless, crea un token API nell'interfaccia web di ClawHub ed esegui:

```bash
clawhub login --token clh_...
```

## `whoami` o `publish` restituisce `Unauthorized` (401)

- Accedi di nuovo con `clawhub login`.
- Se usi un percorso di configurazione personalizzato, conferma che `CLAWHUB_CONFIG_PATH` punti al
  file che contiene il tuo token attuale.
- Se usi un token API, conferma che non sia stato revocato nell'interfaccia web.

## La ricerca o l'installazione restituisce `Rate limit exceeded` (429)

Leggi le informazioni sui nuovi tentativi nella risposta:

- `Retry-After`: secondi da attendere prima di riprovare.
- `RateLimit-Remaining` e `RateLimit-Limit`: il tuo budget attuale.
- `RateLimit-Reset` o `X-RateLimit-Reset`: tempistica di reimpostazione.

Se molti utenti condividono un singolo IP di uscita, i limiti per IP anonimi possono essere raggiunti anche quando ogni
persona invia solo poche richieste. Accedi quando possibile e riprova dopo il
ritardo indicato.

## La ricerca o l'installazione fallisce dietro un proxy

La CLI rispetta le variabili proxy standard:

```bash
export HTTPS_PROXY=http://proxy.example.com:3128
clawhub search "my query"
```

I nomi supportati includono `HTTPS_PROXY`, `HTTP_PROXY`, `https_proxy` e
`http_proxy`.

## Una skill non compare nella ricerca

- Controlla lo slug esatto o la pagina del proprietario, se li conosci.
- Conferma che la release sia pubblica e non bloccata da scansione o moderazione.
- Se possiedi la skill, accedi e ispezionala:

```bash
clawhub inspect <skill-slug>
```

La diagnostica visibile al proprietario può spiegare lo stato di scansione, gate di caricamento o moderazione.

## La pubblicazione fallisce perché mancano metadati obbligatori

Per le skill, controlla il frontmatter di `SKILL.md`. Le variabili d'ambiente e gli
strumenti obbligatori devono essere dichiarati in modo che utenti e scanner possano comprendere il pacchetto.

Per i Plugin, controlla i metadati di compatibilità in `package.json`. Le pubblicazioni di code-plugin
richiedono campi di compatibilità OpenClaw come `openclaw.compat.pluginApi` e
`openclaw.build.openclawVersion`.

Visualizza prima l'anteprima del payload di pubblicazione:

```bash
clawhub package publish <source> --family code-plugin --dry-run
```

## La pubblicazione fallisce con un errore di proprietario GitHub o di sorgente

ClawHub usa l'identità GitHub e l'attribuzione della sorgente per collegare i pacchetti ai loro
publisher.

- Assicurati di aver effettuato l'accesso con l'account GitHub che possiede o può pubblicare
  il pacchetto.
- Controlla che l'URL della sorgente sia pubblico o accessibile a ClawHub.
- Per le sorgenti GitHub, usa `owner/repo`, `owner/repo@ref` o un URL GitHub completo.

## `sync` indica che non sono state trovate skill

`sync` cerca cartelle contenenti `SKILL.md` o `skill.md`.

Indica le radici che vuoi scansionare:

```bash
clawhub sync --root /path/to/skills
```

Visualizza prima l'anteprima se non sei sicuro di cosa verrà pubblicato:

```bash
clawhub sync --all --dry-run --no-input
```

## `update` rifiuta l'operazione a causa di modifiche locali

I file locali non corrispondono ad alcuna versione conosciuta da ClawHub. Scegli un'opzione:

- Mantieni le modifiche locali e salta l'aggiornamento.
- Sovrascrivi con la versione pubblicata:

```bash
clawhub update <slug> --force
```

- Pubblica la copia modificata come nuovo slug o fork.

## L'installazione di un Plugin fallisce in OpenClaw

- Usa una sorgente ClawHub esplicita:

```bash
openclaw plugins install clawhub:<package>
```

- Controlla la pagina dei dettagli del pacchetto per lo stato della scansione e i metadati di compatibilità.
- Conferma che la tua versione di OpenClaw soddisfi l'intervallo di compatibilità
  dichiarato dal pacchetto.
- Se il pacchetto è nascosto, trattenuto o bloccato, potrebbe non essere installabile finché
  il proprietario non risolve il problema.

## Le richieste API pubbliche falliscono

- Rispetta le intestazioni di nuovo tentativo `429` e memorizza nella cache le risposte pubbliche di elenco/ricerca.
- Rimanda gli utenti all'elenco canonico di ClawHub.
- Non replicare contenuti nascosti, privati, trattenuti o bloccati dalla moderazione al di fuori della
  superficie dell'API pubblica.

Vedi [API HTTP](/it/clawhub/http-api) per i dettagli degli endpoint.
