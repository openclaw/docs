---
read_when:
    - I comandi CLI di ClawHub o del registro OpenClaw non riescono
    - Non è possibile installare, pubblicare o aggiornare un pacchetto
summary: Risoluzione dei problemi di accesso, installazione, pubblicazione, aggiornamento e API di ClawHub.
x-i18n:
    generated_at: "2026-06-30T22:20:51Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: fc789fcc891cf8c44b5d1a10d38a4e6dd4dec9474d8d13f8058ea1c3392a9f91
    source_path: clawhub/troubleshooting.md
    workflow: 16
---

# Risoluzione dei problemi

## `clawhub login` apre un browser ma non viene mai completato

La CLI avvia un server di callback locale di breve durata durante l'accesso dal browser.

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

Leggi le informazioni sul nuovo tentativo nella risposta:

- `Retry-After`: secondi da attendere prima di riprovare.
- `RateLimit-Limit`: il limite applicato a questa richiesta.
- `RateLimit-Remaining`: il tuo budget rimanente esatto quando l'header è presente. Su `429`, è `0`.
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

## Una skill non compare nella ricerca

- Controlla lo slug esatto o la pagina del proprietario, se la conosci.
- Conferma che la release sia pubblica e non bloccata da scansione o moderazione.
- Se possiedi la skill, accedi e ispezionala:

```bash
clawhub inspect @openclaw/demo
```

La diagnostica visibile al proprietario può spiegare lo stato di scansione, gate di caricamento o moderazione.

## La pubblicazione non riesce perché mancano metadati obbligatori

Per le skill, controlla il frontmatter di `SKILL.md`. Le variabili d'ambiente e gli
strumenti richiesti devono essere dichiarati in modo che utenti e scanner possano comprendere il pacchetto.

Per i plugin, controlla i metadati di compatibilità in `package.json`. Le pubblicazioni di code-plugin
richiedono campi di compatibilità OpenClaw come `openclaw.compat.pluginApi` e
`openclaw.build.openclawVersion`.

Visualizza prima l'anteprima del payload di pubblicazione:

```bash
clawhub package publish <source> --family code-plugin --dry-run
```

## La pubblicazione non riesce con un errore di proprietario GitHub o di sorgente

ClawHub usa l'identità GitHub e l'attribuzione della sorgente per collegare i pacchetti ai loro
publisher.

- Assicurati di aver effettuato l'accesso con l'account GitHub che possiede o può pubblicare
  il pacchetto.
- Controlla che l'URL sorgente sia pubblico o accessibile a ClawHub.
- Per le sorgenti GitHub, usa `owner/repo`, `owner/repo@ref` o un URL GitHub completo.

## La pubblicazione non riesce perché un namespace è rivendicato o riservato

Se una pubblicazione non riesce perché l'handle del proprietario, il namespace dell'organizzazione, lo scope del pacchetto, lo
slug della skill o il nome del pacchetto è già rivendicato o riservato, conferma prima di
pubblicare con il proprietario che corrisponde al namespace. Per i pacchetti plugin,
i nomi con scope come `@example-org/example-plugin` devono essere pubblicati come proprietario
`example-org` corrispondente.

Se ritieni che la tua organizzazione, il tuo progetto o il tuo brand sia il legittimo proprietario del namespace ma
non puoi gestire l'attuale proprietario ClawHub, apri una
[segnalazione di rivendicazione organizzazione / namespace](https://github.com/openclaw/clawhub/issues/new?template=org-namespace-claim.yml)
con prove pubbliche e non sensibili. Consulta
[Rivendicazioni di organizzazioni e namespace](/clawhub/namespace-claims) per indicazioni sulle prove e su cosa
tenere fuori dalle issue pubbliche.

## `sync` dice che non sono state trovate skill

`sync` cerca cartelle contenenti `SKILL.md` o `skill.md`.

Puntalo alle radici che vuoi scansionare:

```bash
clawhub sync --root /path/to/skills
```

Visualizza prima un'anteprima se non sei sicuro di cosa verrà pubblicato:

```bash
clawhub sync --all --dry-run --no-input
```

## `update` rifiuta l'operazione a causa di modifiche locali

I file locali non corrispondono ad alcuna versione conosciuta da ClawHub. Scegli una delle opzioni:

- Mantieni le modifiche locali e salta l'aggiornamento.
- Sovrascrivi con la versione pubblicata:

```bash
clawhub update @openclaw/demo --force
```

- Pubblica la tua copia modificata come nuovo slug o fork.

## L'installazione di un plugin non riesce in OpenClaw

- Usa una sorgente ClawHub esplicita:

```bash
openclaw plugins install clawhub:<package>
```

- Controlla la pagina dei dettagli del pacchetto per lo stato di scansione e i metadati di compatibilità.
- Conferma che la tua versione di OpenClaw soddisfi l'intervallo di
  compatibilità dichiarato dal pacchetto.
- Se il pacchetto è nascosto, bloccato in revisione o bloccato, potrebbe non essere installabile finché
  il proprietario non risolve il problema.

## Le richieste API pubbliche non riescono

- Rispetta gli header di nuovo tentativo `429` e memorizza nella cache le risposte pubbliche di elenco/ricerca.
- Rimanda gli utenti alla scheda ClawHub canonica.
- Non replicare contenuti nascosti, privati, bloccati in revisione o bloccati dalla moderazione fuori dalla
  superficie API pubblica.

Consulta [API HTTP](/clawhub/http-api) per i dettagli degli endpoint.
