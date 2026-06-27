---
read_when:
    - Pubblicare una skill o un plugin
    - Debug degli errori di ambito owner o pacchetto
    - Aggiungere il comportamento di pubblicazione nell'interfaccia utente, nella CLI o nel backend
summary: Come funziona la pubblicazione su ClawHub per Skills, Plugin, proprietari, ambiti, rilasci e revisione.
x-i18n:
    generated_at: "2026-06-27T17:17:05Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 5c0270c0bc3316d970feddfc689c1125e1c90a62beeb40d8098dc6a6752cfa70
    source_path: clawhub/publishing.md
    workflow: 16
---

# Pubblicazione

La pubblicazione invia una cartella di skill o un pacchetto Plugin a ClawHub sotto il proprietario che
scegli. ClawHub verifica che il tuo token possa pubblicare per quel proprietario, convalida
metadati, nome, versione, file e informazioni sulla sorgente, quindi archivia la release
e avvia controlli di sicurezza automatizzati.

Se la convalida non riesce, non viene pubblicato nulla. Le nuove release possono anche restare fuori dalle
normali superfici di installazione e download finché la revisione non è completata.

## Skills

Il percorso di pubblicazione più semplice è la CLI. Accedi, quindi pubblica una cartella di skill
locale:

```bash
clawhub login
clawhub skill publish ./my-skill \
  --slug my-skill \
  --name "My Skill" \
  --owner <owner>
```

Usa `--owner <handle>` quando pubblichi per il proprietario di un'organizzazione. Omettilo per pubblicare come
utente autenticato. La pubblicazione salta i contenuti invariati. Una nuova skill inizia
da `1.0.0`, e le modifiche successive pubblicano automaticamente la versione patch seguente. Passa
`--version` solo quando ti serve una versione esplicita.

Per i repository di catalogo, usa il workflow riutilizzabile
[`skill-publish.yml` di ClawHub](https://github.com/openclaw/clawhub/blob/main/.github/workflows/skill-publish.yml).
Chiama `skill publish` per ogni cartella di skill immediata sotto `root` (predefinito:
`skills`), oppure solo per la cartella fornita come `skill_path`.

```yaml
jobs:
  publish:
    uses: openclaw/clawhub/.github/workflows/skill-publish.yml@main
    with:
      owner: <owner>
      dry_run: false
    secrets:
      clawhub_token: ${{ secrets.CLAWHUB_TOKEN }}
```

Usa `dry_run: true` per visualizzare in anteprima le skill nuove e modificate senza pubblicarle.

## Plugin

I Plugin usano nomi di pacchetto in stile npm. I nomi di pacchetto con scope includono il proprietario nella
prima parte del nome:

```text
@owner/package-name
```

Lo scope deve corrispondere al proprietario di pubblicazione selezionato. Se il tuo pacchetto si chiama
`@openclaw/dronzer`, può essere pubblicato solo come `@openclaw`. Se pubblichi come
`@vintageayu`, rinomina il pacchetto in `@vintageayu/dronzer`.

Questo impedisce a un pacchetto di rivendicare un namespace di organizzazione che il publisher non
controlla.

Se sei il legittimo proprietario di un'organizzazione, brand, scope di pacchetto, handle proprietario o
namespace che è già rivendicato o riservato su ClawHub, apri una
[segnalazione di rivendicazione organizzazione / namespace](https://github.com/openclaw/clawhub/issues/new?template=org-namespace-claim.yml)
con prove pubbliche e non sensibili. Consulta
[Rivendicazioni di organizzazioni e namespace](/it/clawhub/namespace-claims) per sapere cosa includere e cosa
tenere fuori dalle segnalazioni pubbliche.

### Prima di pubblicare un Plugin

- Scegli un proprietario che corrisponda allo scope del pacchetto.
- Includi `openclaw.plugin.json`. I Plugin di codice richiedono anche `package.json` con
  `openclaw.compat.pluginApi` e `openclaw.build.openclawVersion`.
- Per mostrare un'icona personalizzata nella scheda del Plugin, aggiungi `icon` a `openclaw.plugin.json` con
  qualsiasi URL immagine HTTPS.
- Includi il repository sorgente e i metadati esatti del commit, oppure usa la CLI da un
  checkout basato su GitHub così può rilevarli.
- Esegui `clawhub package validate <source>` prima di pubblicare. Per risultati su pacchetto,
  manifest, import SDK o artefatto, consulta
  [Correzioni di convalida dei Plugin](/it/clawhub/plugin-validation-fixes).
- Esegui `clawhub package publish <source> --dry-run` prima di creare una release.
- Aspettati che le nuove release restino fuori dalle superfici di installazione pubbliche finché i controlli di
  sicurezza automatizzati e la verifica non sono completati.

### Pubblicazione attendibile per i pacchetti

La pubblicazione attendibile dei pacchetti è una configurazione in due passaggi:

1. Pubblica il pacchetto una volta tramite il normale
   `clawhub package publish` manuale o autenticato con token. Questo crea la riga del pacchetto e stabilisce i
   gestori del pacchetto che possono modificare la configurazione del publisher attendibile.
2. Un gestore del pacchetto imposta la configurazione del publisher attendibile di GitHub Actions:

```bash
clawhub package trusted-publisher set @owner/package-name \
  --repository owner/repo \
  --workflow-filename package-publish.yml
```

Dopo che la configurazione è impostata, le future pubblicazioni GitHub Actions supportate possono usare
OIDC/pubblicazione attendibile senza archiviare un token ClawHub a lunga durata nel
repository. Il repository configurato e il nome file del workflow devono corrispondere alla
claim OIDC di GitHub Actions. Se passi anche `--environment <name>`, la claim dell'ambiente di GitHub
Actions deve corrispondere esattamente a quel nome.

ClawHub verifica il repository GitHub configurato quando viene impostata la configurazione del publisher
attendibile. I repository pubblici possono essere verificati tramite metadati GitHub pubblici.
I repository privati richiedono che ClawHub abbia accesso GitHub a quel repository,
per esempio tramite una futura installazione della GitHub App di ClawHub o un'altra
integrazione GitHub autorizzata.

L'attuale workflow riutilizzabile di pubblicazione pacchetti supporta la pubblicazione attendibile senza segreti
per le pubblicazioni `workflow_dispatch` quando `id-token: write` è
disponibile. Le pubblicazioni reali da push di tag richiedono ancora `clawhub_token`, quindi mantieni
`CLAWHUB_TOKEN` disponibile per release da tag, prime pubblicazioni, pacchetti non attendibili
o pubblicazioni di emergenza.

Ispeziona o rimuovi la configurazione con:

```bash
clawhub package trusted-publisher get @owner/package-name
clawhub package trusted-publisher delete @owner/package-name
```

L'eliminazione della configurazione del publisher attendibile è il percorso di rollback. Disabilita la futura
creazione di token di pubblicazione attendibile finché un gestore del pacchetto non imposta di nuovo la configurazione.

## Domande frequenti

### Lo scope del pacchetto deve corrispondere al proprietario selezionato

Se lo scope del pacchetto e il proprietario selezionato non corrispondono, ClawHub rifiuta la
pubblicazione:

```text
Package scope "@openclaw" must match selected owner "@vintageayu".
Publish as "@openclaw" or rename this package to "@vintageayu/dronzer".
```

Per risolvere, scegli il proprietario indicato dallo scope del pacchetto, oppure rinomina il
pacchetto in modo che lo scope corrisponda al proprietario con cui puoi pubblicare.

Se il nome del pacchetto ha già lo scope corretto ma il pacchetto appartiene al
publisher sbagliato, trasferisci invece la proprietà:

```sh
clawhub package transfer @opik/opik-openclaw --to opik
```

Usa il trasferimento di pacchetto o skill solo quando hai accesso amministrativo sia al
proprietario attuale sia al publisher di destinazione. Il trasferimento del pacchetto non ti consente di
pubblicare in uno scope che non puoi gestire.

Se non hai accesso al proprietario attuale ma ritieni che la tua organizzazione, progetto o
brand sia il legittimo proprietario del namespace, apri una
[segnalazione di rivendicazione organizzazione / namespace](https://github.com/openclaw/clawhub/issues/new?template=org-namespace-claim.yml)
con prove pubbliche e non sensibili per la revisione da parte dello staff. Consulta
[Rivendicazioni di organizzazioni e namespace](/it/clawhub/namespace-claims) prima di inviare la richiesta.

Questo protegge i namespace delle organizzazioni. Un pacchetto chiamato `@openclaw/dronzer` rivendica il
namespace `@openclaw`, quindi solo i publisher con accesso al proprietario `@openclaw`
possono pubblicarlo.
