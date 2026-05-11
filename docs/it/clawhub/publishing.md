---
read_when:
    - Pubblicare una skill o un Plugin
    - Diagnosi degli errori di ambito del proprietario o del pacchetto
    - Aggiunta dell'interfaccia utente di pubblicazione, della CLI o del comportamento del backend
summary: Come funziona la pubblicazione su ClawHub per Skills, Plugin, proprietari, ambiti, rilasci e revisione.
x-i18n:
    generated_at: "2026-05-11T20:24:13Z"
    model: gpt-5.5
    provider: openai
    source_hash: 566c37b7845159ad100837e34bed7c60411bba6a0b3436ab899fe5e345237727
    source_path: clawhub/publishing.md
    workflow: 16
---

# Pubblicazione

La pubblicazione su ClawHub è limitata al proprietario: ogni pubblicazione ha come destinazione un publisher, e il
server decide se l'utente che ha effettuato l'accesso è autorizzato a pubblicare lì.

## Proprietari

Un proprietario è un handle di publisher ClawHub, come `@alice` o `@openclaw`.
I proprietari personali vengono creati per gli utenti. I proprietari di organizzazioni possono avere più membri.

Quando pubblichi, usi il tuo proprietario personale oppure scegli un proprietario di organizzazione
per cui hai accesso come publisher.

## Skills

Le Skills vengono pubblicate da una cartella di skill. La pagina pubblica è:

```text
https://clawhub.ai/<owner>/<slug>
```

Esempio:

```text
https://clawhub.ai/alice/review-helper
```

La richiesta di pubblicazione include il proprietario selezionato, lo slug, la versione, il changelog e i
file. Il server verifica che l'attore possa pubblicare come quel proprietario prima di
creare la release.

Per spostare una skill esistente a un altro proprietario durante la pubblicazione di una nuova versione, scegli
il nuovo proprietario e conferma esplicitamente lo spostamento della proprietà. Nella CLI/API, passa il
proprietario di destinazione più il consenso alla migrazione:

```sh
clawhub skill publish ./review-helper --owner openclaw --migrate-owner --version 1.2.0
```

La migrazione del proprietario della skill richiede accesso da amministratore o proprietario sia al proprietario attuale
sia al proprietario di destinazione. Preserva la skill, la cronologia delle versioni, le statistiche,
i commenti, i fork, gli alias e la traccia di audit; i vecchi URL del proprietario continuano a funzionare tramite il
percorso alias/reindirizzamento.

## Plugin

I Plugin usano nomi di pacchetto in stile npm. I nomi di pacchetto con scope includono il proprietario nella
prima parte del nome:

```text
@owner/package-name
```

Lo scope deve corrispondere al proprietario di pubblicazione selezionato. Se il tuo pacchetto si chiama
`@openclaw/dronzer`, può essere pubblicato solo come `@openclaw`. Se pubblichi come
`@vintageayu`, rinomina il pacchetto in `@vintageayu/dronzer`.

Questo impedisce a un pacchetto di rivendicare uno spazio dei nomi di organizzazione che il publisher non
controlla.

## Flusso di release

1. L'interfaccia utente, la CLI o il workflow GitHub raccoglie i metadati e i file del pacchetto.
2. La richiesta di pubblicazione viene inviata a ClawHub con il proprietario selezionato.
3. Il server convalida le autorizzazioni del proprietario, lo scope del pacchetto, il nome del pacchetto, la versione,
   i limiti dei file e i metadati della sorgente.
4. ClawHub archivia la release e avvia controlli di sicurezza automatizzati.
5. Le nuove release restano nascoste dalle normali superfici di installazione/download finché la revisione
   e la verifica non sono completate.

Se la convalida non riesce, la release non viene creata.

## FAQ

### Lo scope del pacchetto deve corrispondere al proprietario selezionato

Se lo scope del pacchetto e il proprietario selezionato non corrispondono, ClawHub rifiuta la
pubblicazione:

```text
Package scope "@openclaw" must match selected owner "@vintageayu".
Publish as "@openclaw" or rename this package to "@vintageayu/dronzer".
```

Per risolvere, scegli il proprietario indicato dallo scope del pacchetto oppure rinomina il
pacchetto in modo che lo scope corrisponda al proprietario con cui puoi pubblicare.

Se il nome del pacchetto ha già lo scope corretto ma il pacchetto appartiene al
publisher sbagliato, trasferisci invece la proprietà:

```sh
clawhub package transfer @opik/opik-openclaw --to opik
```

Usa il trasferimento di pacchetto o skill solo quando hai accesso da amministratore sia al
proprietario attuale sia al publisher di destinazione. Il trasferimento di pacchetto non ti consente di
pubblicare in uno scope che non puoi gestire.

Questo protegge gli spazi dei nomi delle organizzazioni. Un pacchetto chiamato `@openclaw/dronzer` rivendica lo
spazio dei nomi `@openclaw`, quindi solo i publisher con accesso al proprietario `@openclaw`
possono pubblicarlo.
