---
read_when:
    - Pubblicare una skill o un plugin
    - Debug degli errori relativi al proprietario o all'ambito del pacchetto
    - Aggiunta del comportamento di pubblicazione nell'interfaccia utente, nella CLI o nel backend
summary: Come funziona la pubblicazione su ClawHub per Skills, Plugin, proprietari, ambiti, versioni e revisione.
x-i18n:
    generated_at: "2026-07-12T06:52:58Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 5c0270c0bc3316d970feddfc689c1125e1c90a62beeb40d8098dc6a6752cfa70
    source_path: clawhub/publishing.md
    workflow: 16
---

# Pubblicazione

La pubblicazione invia una cartella di skill o un pacchetto di Plugin a ClawHub sotto il proprietario scelto. ClawHub verifica che il token possa pubblicare per tale proprietario, convalida i metadati, il nome, la versione, i file e le informazioni sull'origine, quindi archivia la versione e avvia i controlli di sicurezza automatizzati.

Se la convalida non riesce, non viene pubblicato nulla. Le nuove versioni possono inoltre rimanere escluse dalle normali interfacce di installazione e download fino al completamento della revisione.

## Skills

Il percorso di pubblicazione più semplice è la CLI. Accedi, quindi pubblica una cartella di skill locale:

```bash
clawhub login
clawhub skill publish ./my-skill \
  --slug my-skill \
  --name "My Skill" \
  --owner <owner>
```

Usa `--owner <handle>` quando pubblichi per un'organizzazione proprietaria. Omettilo per pubblicare come utente autenticato. La pubblicazione ignora i contenuti invariati. Una nuova skill inizia dalla versione `1.0.0` e le modifiche successive pubblicano automaticamente la versione patch seguente. Specifica `--version` solo quando è necessaria una versione esplicita.

Per i repository di cataloghi, usa il [flusso di lavoro `skill-publish.yml` riutilizzabile](https://github.com/openclaw/clawhub/blob/main/.github/workflows/skill-publish.yml) di ClawHub. Esegue `skill publish` per ogni cartella di skill immediatamente sotto `root` (valore predefinito: `skills`) oppure solo per la cartella specificata come `skill_path`.

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

I Plugin usano nomi di pacchetto in stile npm. I nomi di pacchetto con ambito includono il proprietario nella prima parte del nome:

```text
@owner/package-name
```

L'ambito deve corrispondere al proprietario selezionato per la pubblicazione. Se il pacchetto si chiama `@openclaw/dronzer`, può essere pubblicato solo come `@openclaw`. Se pubblichi come `@vintageayu`, rinomina il pacchetto in `@vintageayu/dronzer`.

Ciò impedisce a un pacchetto di rivendicare lo spazio dei nomi di un'organizzazione non controllata da chi pubblica.

Se sei il legittimo proprietario di un'organizzazione, un marchio, un ambito di pacchetto, un identificativo di proprietario o uno spazio dei nomi già rivendicato o riservato su ClawHub, apri una [segnalazione di rivendicazione di un'organizzazione o uno spazio dei nomi](https://github.com/openclaw/clawhub/issues/new?template=org-namespace-claim.yml) con prove pubbliche e non sensibili. Consulta [Rivendicazioni di organizzazioni e spazi dei nomi](/clawhub/namespace-claims) per sapere cosa includere e cosa non inserire nelle segnalazioni pubbliche.

### Prima di pubblicare un Plugin

- Scegli un proprietario che corrisponda all'ambito del pacchetto.
- Includi `openclaw.plugin.json`. I Plugin con codice richiedono anche `package.json` con `openclaw.compat.pluginApi` e `openclaw.build.openclawVersion`.
- Per mostrare un'icona personalizzata nella scheda del Plugin, aggiungi `icon` a `openclaw.plugin.json` con un qualsiasi URL HTTPS di un'immagine.
- Includi il repository sorgente e i metadati esatti del commit oppure usa la CLI da un checkout basato su GitHub, affinché possa rilevarli.
- Esegui `clawhub package validate <source>` prima della pubblicazione. Per i problemi relativi a pacchetto, manifesto, importazione dell'SDK o artefatto, consulta [Correzioni della convalida dei Plugin](/clawhub/plugin-validation-fixes).
- Esegui `clawhub package publish <source> --dry-run` prima di creare una versione.
- Prevedi che le nuove versioni rimangano escluse dalle interfacce pubbliche di installazione fino al completamento dei controlli di sicurezza automatizzati e della verifica.

### Pubblicazione attendibile dei pacchetti

La configurazione della pubblicazione attendibile dei pacchetti richiede due passaggi:

1. Pubblica una volta il pacchetto tramite il normale comando manuale o autenticato con token `clawhub package publish`. Questo crea la riga del pacchetto e definisce i gestori del pacchetto autorizzati a modificarne la configurazione dell'editore attendibile.
2. Un gestore del pacchetto imposta la configurazione dell'editore attendibile di GitHub Actions:

```bash
clawhub package trusted-publisher set @owner/package-name \
  --repository owner/repo \
  --workflow-filename package-publish.yml
```

Dopo aver impostato la configurazione, le future pubblicazioni supportate tramite GitHub Actions possono usare OIDC e la pubblicazione attendibile senza archiviare nel repository un token ClawHub di lunga durata. Il repository e il nome del file del flusso di lavoro configurati devono corrispondere all'attestazione OIDC di GitHub Actions. Se specifichi anche `--environment <name>`, l'attestazione dell'ambiente di GitHub Actions deve corrispondere esattamente a tale nome.

ClawHub verifica il repository GitHub configurato quando viene impostata la configurazione dell'editore attendibile. I repository pubblici possono essere verificati tramite i metadati pubblici di GitHub. Per i repository privati, ClawHub deve avere accesso GitHub al repository, ad esempio tramite una futura installazione dell'app GitHub di ClawHub o un'altra integrazione GitHub autorizzata.

L'attuale flusso di lavoro riutilizzabile per la pubblicazione dei pacchetti supporta la pubblicazione attendibile senza segreti per le pubblicazioni tramite `workflow_dispatch` quando è disponibile `id-token: write`. Le pubblicazioni effettive tramite push di tag richiedono ancora `clawhub_token`; mantieni quindi disponibile `CLAWHUB_TOKEN` per le versioni basate su tag, le prime pubblicazioni, i pacchetti non attendibili o le pubblicazioni di emergenza.

Esamina o rimuovi la configurazione con:

```bash
clawhub package trusted-publisher get @owner/package-name
clawhub package trusted-publisher delete @owner/package-name
```

L'eliminazione della configurazione dell'editore attendibile costituisce la procedura di ripristino. Disabilita la futura generazione di token per la pubblicazione attendibile finché un gestore del pacchetto non imposta nuovamente la configurazione.

## Domande frequenti

### L'ambito del pacchetto deve corrispondere al proprietario selezionato

Se l'ambito del pacchetto e il proprietario selezionato non corrispondono, ClawHub rifiuta la pubblicazione:

```text
L'ambito del pacchetto "@openclaw" deve corrispondere al proprietario selezionato "@vintageayu".
Pubblica come "@openclaw" oppure rinomina questo pacchetto in "@vintageayu/dronzer".
```

Per correggere il problema, scegli il proprietario indicato dall'ambito del pacchetto oppure rinomina il pacchetto in modo che l'ambito corrisponda al proprietario con cui puoi pubblicare.

Se il nome del pacchetto ha già l'ambito corretto, ma il pacchetto appartiene al soggetto sbagliato, trasferiscine invece la proprietà:

```sh
clawhub package transfer @opik/opik-openclaw --to opik
```

Usa il trasferimento di un pacchetto o di una skill solo se disponi dell'accesso amministrativo sia al proprietario attuale sia al soggetto di pubblicazione di destinazione. Il trasferimento del pacchetto non consente di pubblicare in un ambito che non puoi gestire.

Se non hai accesso al proprietario attuale, ma ritieni che la tua organizzazione, il tuo progetto o il tuo marchio sia il legittimo proprietario dello spazio dei nomi, apri una [segnalazione di rivendicazione di un'organizzazione o uno spazio dei nomi](https://github.com/openclaw/clawhub/issues/new?template=org-namespace-claim.yml) con prove pubbliche e non sensibili affinché il personale possa esaminarla. Consulta [Rivendicazioni di organizzazioni e spazi dei nomi](/clawhub/namespace-claims) prima di inviare la segnalazione.

Questo protegge gli spazi dei nomi delle organizzazioni. Un pacchetto denominato `@openclaw/dronzer` rivendica lo spazio dei nomi `@openclaw`, pertanto può essere pubblicato solo da soggetti che dispongono dell'accesso al proprietario `@openclaw`.
