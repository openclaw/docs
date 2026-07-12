---
read_when:
    - I comandi della CLI di ClawHub o del registro di OpenClaw non riescono
    - Non è possibile installare, pubblicare o aggiornare un pacchetto
summary: Risoluzione dei problemi di accesso, installazione, pubblicazione, aggiornamento e API di ClawHub.
x-i18n:
    generated_at: "2026-07-12T06:53:23Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: fc789fcc891cf8c44b5d1a10d38a4e6dd4dec9474d8d13f8058ea1c3392a9f91
    source_path: clawhub/troubleshooting.md
    workflow: 16
---

# Risoluzione dei problemi

## `clawhub login` apre un browser ma non viene mai completato

Durante l'accesso tramite browser, la CLI avvia un server di callback locale di breve durata.

- Assicurati che il browser possa raggiungere `http://127.0.0.1:<port>/callback`.
- Se il callback non arriva, controlla le regole locali del firewall, della VPN e del proxy.
- Negli ambienti headless, crea un token API nell'interfaccia web di ClawHub ed esegui:

```bash
clawhub login --token clh_...
```

## `whoami` o `publish` restituisce `Unauthorized` (401)

- Accedi nuovamente con `clawhub login`.
- Se utilizzi un percorso di configurazione personalizzato, verifica che `CLAWHUB_CONFIG_PATH` punti al
  file contenente il token corrente.
- Se utilizzi un token API, verifica che non sia stato revocato nell'interfaccia web.

## La ricerca o l'installazione restituisce `Rate limit exceeded` (429)

Leggi le informazioni sui nuovi tentativi contenute nella risposta:

- `Retry-After`: secondi da attendere prima di riprovare.
- `RateLimit-Limit`: limite applicato a questa richiesta.
- `RateLimit-Remaining`: budget residuo esatto quando l'intestazione è presente. In caso di `429`, è `0`.
- `RateLimit-Reset` o `X-RateLimit-Reset`: tempistica di reimpostazione.

Se molti utenti condividono lo stesso indirizzo IP di uscita, i limiti per gli IP anonimi possono essere raggiunti anche quando ogni
persona invia solo poche richieste. Accedi quando possibile e riprova dopo il
tempo di attesa indicato.

## La ricerca o l'installazione non riesce dietro un proxy

La CLI rispetta le variabili proxy standard:

```bash
export HTTPS_PROXY=http://proxy.example.com:3128
clawhub search "my query"
```

I nomi supportati includono `HTTPS_PROXY`, `HTTP_PROXY`, `https_proxy` e
`http_proxy`.

## Una skill non appare nella ricerca

- Controlla lo slug esatto o la pagina del proprietario, se li conosci.
- Verifica che la versione sia pubblica e non trattenuta dalla scansione o dalla moderazione.
- Se la skill è tua, accedi ed esaminala:

```bash
clawhub inspect @openclaw/demo
```

La diagnostica visibile al proprietario può spiegare lo stato della scansione, del controllo di caricamento o della moderazione.

## La pubblicazione non riesce perché mancano i metadati obbligatori

Per le skill, controlla il frontmatter di `SKILL.md`. Le variabili d'ambiente e gli
strumenti obbligatori devono essere dichiarati affinché gli utenti e gli scanner possano comprendere il pacchetto.

Per i plugin, controlla i metadati di compatibilità in `package.json`. Le pubblicazioni dei
plugin di codice richiedono campi di compatibilità con OpenClaw, come `openclaw.compat.pluginApi` e
`openclaw.build.openclawVersion`.

Visualizza prima un'anteprima del payload di pubblicazione:

```bash
clawhub package publish <source> --family code-plugin --dry-run
```

## La pubblicazione non riesce a causa di un errore relativo al proprietario o alla sorgente GitHub

ClawHub utilizza l'identità GitHub e l'attribuzione della sorgente per collegare i pacchetti ai rispettivi
autori della pubblicazione.

- Assicurati di aver effettuato l'accesso con l'account GitHub che possiede il pacchetto o può pubblicarlo.
- Controlla che l'URL della sorgente sia pubblico o accessibile a ClawHub.
- Per le sorgenti GitHub, usa `owner/repo`, `owner/repo@ref` o un URL GitHub completo.

## La pubblicazione non riesce perché uno spazio dei nomi è rivendicato o riservato

Se una pubblicazione non riesce perché l'identificativo del proprietario, lo spazio dei nomi dell'organizzazione, l'ambito del pacchetto, lo slug della skill
o il nome del pacchetto è già rivendicato o riservato, verifica innanzitutto di
pubblicare con il proprietario corrispondente allo spazio dei nomi. Per i pacchetti plugin,
i nomi con ambito come `@example-org/example-plugin` devono essere pubblicati con il
proprietario `example-org` corrispondente.

Se ritieni che la tua organizzazione, il tuo progetto o il tuo marchio sia il legittimo proprietario dello spazio dei nomi, ma
non puoi gestire l'attuale proprietario su ClawHub, apri una
[segnalazione per la rivendicazione di un'organizzazione o di uno spazio dei nomi](https://github.com/openclaw/clawhub/issues/new?template=org-namespace-claim.yml)
includendo prove pubbliche e non sensibili. Consulta
[Rivendicazioni di organizzazioni e spazi dei nomi](/clawhub/namespace-claims) per indicazioni sulle prove e su cosa
non includere nelle segnalazioni pubbliche.

## `sync` segnala che non è stata trovata alcuna skill

`sync` cerca cartelle contenenti `SKILL.md` o `skill.md`.

Indica le directory radice da analizzare:

```bash
clawhub sync --root /path/to/skills
```

Se non sai con certezza cosa verrà pubblicato, visualizza prima un'anteprima:

```bash
clawhub sync --all --dry-run --no-input
```

## `update` rifiuta l'operazione a causa di modifiche locali

I file locali non corrispondono ad alcuna versione nota a ClawHub. Scegli un'opzione:

- Mantieni le modifiche locali e ignora l'aggiornamento.
- Sovrascrivi con la versione pubblicata:

```bash
clawhub update @openclaw/demo --force
```

- Pubblica la copia modificata con un nuovo slug o come fork.

## L'installazione di un plugin non riesce in OpenClaw

- Usa una sorgente ClawHub esplicita:

```bash
openclaw plugins install clawhub:<package>
```

- Controlla nella pagina dei dettagli del pacchetto lo stato della scansione e i metadati di compatibilità.
- Verifica che la tua versione di OpenClaw soddisfi l'intervallo di compatibilità dichiarato dal
  pacchetto.
- Se il pacchetto è nascosto, trattenuto o bloccato, potrebbe non essere installabile finché
  il proprietario non risolve il problema.

## Le richieste API pubbliche non riescono

- Rispetta le intestazioni per i nuovi tentativi in caso di `429` e memorizza nella cache le risposte pubbliche di elenco e ricerca.
- Rimanda gli utenti alla pagina canonica del pacchetto su ClawHub.
- Non replicare contenuti nascosti, privati, trattenuti o bloccati dalla moderazione al di fuori della
  superficie dell'API pubblica.

Consulta [API HTTP](/clawhub/http-api) per i dettagli degli endpoint.
