---
read_when:
    - Pubblicazione di una skill o di un Plugin
    - Debug degli errori di ambito del proprietario o del pacchetto
    - Aggiunta dell'interfaccia utente di pubblicazione, della CLI o del comportamento lato server
summary: Come funziona la pubblicazione su ClawHub per Skills, Plugin, proprietari, ambiti, rilasci e revisione.
x-i18n:
    generated_at: "2026-05-10T19:25:59Z"
    model: gpt-5.5
    provider: openai
    source_hash: 61de013f0ac82acbf20f99c3e0c92c8e31d3de14e9ee64f7bc7659d522747089
    source_path: clawhub/publishing.md
    workflow: 16
---

# Pubblicazione

La pubblicazione su ClawHub ha ambito per proprietario: ogni pubblicazione riguarda un editore e il
server decide se l'utente autenticato è autorizzato a pubblicare lì.

## Proprietari

Un proprietario è un handle editore di ClawHub, ad esempio `@alice` o `@openclaw`.
I proprietari personali vengono creati per gli utenti. I proprietari di organizzazione possono avere più membri.

Quando pubblichi, usi il tuo proprietario personale oppure scegli un proprietario di organizzazione
per cui hai accesso come editore.

## Skills

Le Skills vengono pubblicate da una cartella skill. La pagina pubblica è:

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

La migrazione del proprietario della skill richiede accesso amministratore o proprietario sia sul proprietario attuale
sia sul proprietario di destinazione. Preserva la skill, la cronologia delle versioni, le statistiche,
i commenti, i fork, gli alias e la traccia di audit; i vecchi URL del proprietario continuano a funzionare tramite il
percorso di alias/reindirizzamento.

## Plugin

I Plugin usano nomi di pacchetto in stile npm. I nomi di pacchetto con ambito includono il proprietario nella
prima parte del nome:

```text
@owner/package-name
```

L'ambito deve corrispondere al proprietario di pubblicazione selezionato. Se il tuo pacchetto si chiama
`@openclaw/dronzer`, può essere pubblicato solo come `@openclaw`. Se pubblichi come
`@vintageayu`, rinomina il pacchetto in `@vintageayu/dronzer`.

Questo impedisce a un pacchetto di rivendicare uno spazio dei nomi di organizzazione che l'editore non
controlla.

## Flusso di Release

1. L'interfaccia utente, la CLI o il workflow GitHub raccolgono i metadati e i file del pacchetto.
2. La richiesta di pubblicazione viene inviata a ClawHub con il proprietario selezionato.
3. Il server convalida i permessi del proprietario, l'ambito del pacchetto, il nome del pacchetto, la versione,
   i limiti dei file e i metadati di origine.
4. ClawHub archivia la release e avvia controlli di sicurezza automatizzati.
5. Le nuove release sono nascoste dalle normali superfici di installazione/download finché la revisione
   e la verifica non sono completate.

Se la convalida fallisce, la release non viene creata.

## Domande frequenti

### L'ambito del pacchetto deve corrispondere al proprietario selezionato

Se l'ambito del pacchetto e il proprietario selezionato non corrispondono, ClawHub rifiuta la
pubblicazione:

```text
Package scope "@openclaw" must match selected owner "@vintageayu".
Publish as "@openclaw" or rename this package to "@vintageayu/dronzer".
```

Per risolvere il problema, scegli il proprietario indicato dall'ambito del pacchetto oppure rinomina il
pacchetto in modo che l'ambito corrisponda al proprietario con cui puoi pubblicare.

Se il nome del pacchetto ha già l'ambito corretto ma il pacchetto è di proprietà dell'editore
sbagliato, trasferisci invece la proprietà:

```sh
clawhub package transfer @opik/opik-openclaw --to opik
```

Usa il trasferimento del pacchetto solo quando hai accesso amministratore sia al proprietario attuale del pacchetto
sia all'editore di destinazione. Non ti consente di pubblicare in un ambito che
non puoi gestire.

Questo protegge gli spazi dei nomi delle organizzazioni. Un pacchetto chiamato `@openclaw/dronzer` rivendica lo
spazio dei nomi `@openclaw`, quindi solo gli editori con accesso al proprietario `@openclaw`
possono pubblicarlo.
