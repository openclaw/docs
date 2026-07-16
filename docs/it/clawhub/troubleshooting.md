---
read_when:
    - I comandi della CLI di ClawHub o del registro di OpenClaw non riescono
    - Un pacchetto non può essere installato, pubblicato o aggiornato
summary: Risoluzione dei problemi di accesso, installazione, pubblicazione, aggiornamento e API di ClawHub.
x-i18n:
    generated_at: "2026-07-16T13:59:14Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: fc789fcc891cf8c44b5d1a10d38a4e6dd4dec9474d8d13f8058ea1c3392a9f91
    source_path: clawhub/troubleshooting.md
    workflow: 16
---

# Risoluzione dei problemi

## `clawhub login` apre un browser ma non viene mai completato

La CLI avvia un server di callback locale di breve durata durante l'accesso tramite browser.

- Assicurarsi che il browser possa raggiungere `http://127.0.0.1:<port>/callback`.
- Se il callback non arriva, controllare le regole locali di firewall, VPN e proxy.
- Negli ambienti headless, creare un token API nell'interfaccia web di ClawHub ed eseguire:

```bash
clawhub login --token clh_...
```

## `whoami` o `publish` restituisce `Unauthorized` (401)

- Accedere nuovamente con `clawhub login`.
- Se si utilizza un percorso di configurazione personalizzato, verificare che `CLAWHUB_CONFIG_PATH` punti al
  file contenente il token corrente.
- Se si utilizza un token API, verificare che non sia stato revocato nell'interfaccia web.

## La ricerca o l'installazione restituisce `Rate limit exceeded` (429)

Leggere le informazioni sui nuovi tentativi nella risposta:

- `Retry-After`: secondi da attendere prima di riprovare.
- `RateLimit-Limit`: il limite applicato a questa richiesta.
- `RateLimit-Remaining`: il budget rimanente esatto quando l'intestazione è presente. In `429`, è `0`.
- `RateLimit-Reset` o `X-RateLimit-Reset`: tempistica di reimpostazione.

Se molti utenti condividono un unico indirizzo IP di uscita, i limiti IP anonimi possono essere raggiunti anche quando ogni
persona invia solo poche richieste. Accedere, ove possibile, e riprovare dopo il
ritardo indicato.

## La ricerca o l'installazione non riesce dietro un proxy

La CLI rispetta le variabili proxy standard:

```bash
export HTTPS_PROXY=http://proxy.example.com:3128
clawhub search "my query"
```

I nomi supportati includono `HTTPS_PROXY`, `HTTP_PROXY`, `https_proxy` e
`http_proxy`.

## Una skill non appare nella ricerca

- Se noto, controllare lo slug esatto o la pagina del proprietario.
- Verificare che la versione sia pubblica e non trattenuta dalla scansione o dalla moderazione.
- Se si possiede la skill, accedere ed esaminarla:

```bash
clawhub inspect @openclaw/demo
```

La diagnostica visibile al proprietario può spiegare lo stato della scansione, del controllo di caricamento o della moderazione.

## La pubblicazione non riesce perché mancano metadati obbligatori

Per le skill, controllare il frontmatter `SKILL.md`. Le variabili di ambiente e gli
strumenti obbligatori devono essere dichiarati affinché gli utenti e gli scanner possano comprendere il pacchetto.

Per i plugin, controllare i metadati di compatibilità `package.json`. Le pubblicazioni dei
plugin di codice richiedono campi di compatibilità di OpenClaw come `openclaw.compat.pluginApi` e
`openclaw.build.openclawVersion`.

Visualizzare prima l'anteprima del payload di pubblicazione:

```bash
clawhub package publish <source> --family code-plugin --dry-run
```

## La pubblicazione non riesce a causa di un errore relativo al proprietario o all'origine GitHub

ClawHub utilizza l'identità GitHub e l'attribuzione dell'origine per collegare i pacchetti ai rispettivi
editori.

- Assicurarsi di aver effettuato l'accesso con l'account GitHub che possiede il pacchetto o può
  pubblicarlo.
- Verificare che l'URL dell'origine sia pubblico o accessibile a ClawHub.
- Per le origini GitHub, utilizzare `owner/repo`, `owner/repo@ref` o un URL GitHub completo.

## La pubblicazione non riesce perché uno spazio dei nomi è rivendicato o riservato

Se una pubblicazione non riesce perché l'handle del proprietario, lo spazio dei nomi dell'organizzazione, l'ambito del pacchetto, lo
slug della skill o il nome del pacchetto è già rivendicato o riservato, verificare innanzitutto di
pubblicare con il proprietario corrispondente allo spazio dei nomi. Per i pacchetti plugin,
i nomi con ambito come `@example-org/example-plugin` devono essere pubblicati come
proprietario `example-org` corrispondente.

Se si ritiene che la propria organizzazione, il proprio progetto o marchio sia il legittimo proprietario dello spazio dei nomi, ma
non è possibile gestire l'attuale proprietario ClawHub, aprire una
[segnalazione per la rivendicazione dell'organizzazione o dello spazio dei nomi](https://github.com/openclaw/clawhub/issues/new?template=org-namespace-claim.yml)
con prove pubbliche e non sensibili. Consultare
[Rivendicazioni di organizzazioni e spazi dei nomi](/clawhub/namespace-claims) per indicazioni sulle prove e su cosa
non includere nelle segnalazioni pubbliche.

## `sync` indica che non è stata trovata alcuna skill

`sync` cerca cartelle contenenti `SKILL.md` o `skill.md`.

Indicare le directory radice da sottoporre a scansione:

```bash
clawhub sync --root /path/to/skills
```

Se non si è certi di cosa verrà pubblicato, visualizzare prima l'anteprima:

```bash
clawhub sync --all --dry-run --no-input
```

## `update` rifiuta l'operazione a causa di modifiche locali

I file locali non corrispondono ad alcuna versione nota a ClawHub. Scegliere un'opzione:

- Mantenere le modifiche locali e ignorare l'aggiornamento.
- Sovrascrivere con la versione pubblicata:

```bash
clawhub update @openclaw/demo --force
```

- Pubblicare la copia modificata come nuovo slug o fork.

## L'installazione di un plugin non riesce in OpenClaw

- Utilizzare un'origine ClawHub esplicita:

```bash
openclaw plugins install clawhub:<package>
```

- Controllare nella pagina dei dettagli del pacchetto lo stato della scansione e i metadati di compatibilità.
- Verificare che la versione di OpenClaw soddisfi l'intervallo di compatibilità
  dichiarato dal pacchetto.
- Se il pacchetto è nascosto, trattenuto o bloccato, potrebbe non essere installabile finché
  il proprietario non risolve il problema.

## Le richieste API pubbliche non riescono

- Rispettare le intestazioni di nuovo tentativo `429` e memorizzare nella cache le risposte pubbliche di elenco/ricerca.
- Rimandare gli utenti alla pagina canonica di ClawHub.
- Non replicare contenuti nascosti, privati, trattenuti o bloccati dalla moderazione al di fuori della
  superficie dell'API pubblica.

Consultare [API HTTP](/clawhub/http-api) per i dettagli degli endpoint.
