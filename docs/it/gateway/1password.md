---
read_when:
    - Si desidera rimuovere le chiavi API da openclaw.json e conservarle in 1Password
    - Il Gateway viene eseguito senza interfaccia grafica ed è necessaria l'autenticazione tramite account di servizio per op
    - Si desidera che gli agenti leggano o inseriscano segreti tramite la CLI `op`
summary: Risolvi i segreti del Gateway con la CLI di 1Password e consenti agli agenti di usare la skill 1password inclusa nel bundle
title: 1Password
x-i18n:
    generated_at: "2026-07-16T14:18:38Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: dbe92009cd4409ae8e7235f5462f059783d5ca863557f1a7b12cacd47ee718c9
    source_path: gateway/1password.md
    workflow: 16
---

OpenClaw si integra con **1Password** in due modi indipendenti:

- **Segreti di configurazione:** qualsiasi campo [SecretRef](/it/gateway/secrets) in `openclaw.json` può essere risolto tramite la CLI `op` in fase di esecuzione, così le chiavi API non risiedono mai nel file di configurazione.
- **Flussi di lavoro degli agenti:** la skill `1password` inclusa insegna agli agenti ad autenticarsi e a leggere o inserire segreti con `op` per le proprie attività.

## Requisiti

- La [CLI di 1Password](https://developer.1password.com/docs/cli/get-started/) (`op`) installata sull'host del Gateway (`brew install 1password-cli` su macOS).
- Una modalità di autenticazione per `op`:
  - **Account di servizio** (consigliato per Gateway headless): esportare `OP_SERVICE_ACCOUNT_TOKEN` nell'ambiente del servizio Gateway. Non sono necessari né un'app desktop né un accesso interattivo.
  - **Integrazione con l'app desktop**: l'app 1Password viene eseguita sulla stessa macchina con l'integrazione CLI abilitata. Le prime chiamate possono attivare Touch ID o l'autenticazione di sistema.
  - **Accesso autonomo**: `op signin` richiede l'autenticazione a ogni sessione. È utilizzabile dagli agenti tramite la skill, ma non è adatto alla risoluzione dei segreti di configurazione su un Gateway headless.

## Risolvere i segreti di configurazione con op

Dichiarare un provider di segreti exec che esegua `op read` con un riferimento `op://vault/item/field`, quindi indirizzare a tale provider qualsiasi campo compatibile con SecretRef:

```json5
{
  secrets: {
    providers: {
      onepassword_openai: {
        source: "exec",
        command: "/opt/homebrew/bin/op",
        allowSymlinkCommand: true, // necessario per i binari Homebrew collegati simbolicamente
        trustedDirs: ["/opt/homebrew"],
        args: ["read", "op://Personal/OpenClaw QA API Key/password"],
        passEnv: ["HOME"],
        jsonOnly: false,
      },
    },
  },
  models: {
    providers: {
      openai: {
        baseUrl: "https://api.openai.com/v1",
        models: [{ id: "gpt-5", name: "gpt-5" }],
        apiKey: { source: "exec", provider: "onepassword_openai", id: "value" },
      },
    },
  },
}
```

Come si integrano i vari elementi:

- `command` deve essere un percorso assoluto; `trustedDirs` contrassegna la relativa directory come attendibile e `allowSymlinkCommand` è necessario perché Homebrew installa `op` come collegamento simbolico.
- `args` trasmette il riferimento `op://vault/item/field` senza modificarlo. OpenClaw non analizza direttamente lo schema `op://`; è il binario `op` a risolverlo.
- `passEnv` inoltra le variabili elencate dall'ambiente del Gateway. L'integrazione con l'app desktop richiede `HOME`; gli account di servizio richiedono inoltre che `OP_SERVICE_ACCOUNT_TOKEN` sia presente nell'ambiente del servizio Gateway (aggiungerlo a `passEnv`, oppure impostarlo tramite `env` solo se si accetta che il token sia leggibile nel file di configurazione).
- Per l'output con un singolo valore, mantenere `id: "value"`. Con `jsonOnly: true` e un payload JSON, indirizzare invece i campi mediante un ID puntatore JSON.
- Una voce del provider per ciascun segreto rende i riferimenti verificabili; assegnare ai provider nomi basati sul relativo utilizzatore (`onepassword_openai`, `onepassword_telegram`).

Consultare [Segreti del Gateway](/it/gateway/secrets) per l'ordine di risoluzione, la memorizzazione nella cache e la semantica degli errori, e [Superficie delle credenziali SecretRef](/it/reference/secretref-credential-surface) per tutti i campi che accettano SecretRef.

## Configurazione dell'account di servizio per Gateway headless

1. Creare un account di servizio nell'account 1Password e concedergli l'accesso in lettura esclusivamente agli elementi del vault necessari al Gateway.
2. Fornire `OP_SERVICE_ACCOUNT_TOKEN` al servizio Gateway (plist di launchd, unità systemd o variabile di ambiente del container).
3. Aggiungere `"OP_SERVICE_ACCOUNT_TOKEN"` all'elenco `passEnv` del provider.
4. Verificare dall'ambiente dell'host del Gateway: `op whoami` dovrebbe mostrare l'account di servizio senza richiedere l'autenticazione.

Le letture dell'account di servizio richiedono che il vault sia indicato esplicitamente nel riferimento `op://`. Limitare rigorosamente l'ambito dell'account; si tratta di una credenziale bearer.

## La skill 1password per gli agenti

OpenClaw include una skill `1password` che rende gli agenti operatori competenti di `op`: rileva la modalità di autenticazione disponibile (account di servizio, integrazione con l'app desktop o accesso autonomo), verifica l'accesso con `op whoami` prima di qualsiasi lettura e preferisce `op run` / `op inject` alla scrittura dei valori segreti su disco. La skill richiede il binario `op` e propone l'installazione tramite Homebrew quando non è presente.

Gli agenti la utilizzano per i propri flussi di lavoro, ad esempio per leggere un token di distribuzione durante un'attività o inserire variabili di ambiente in un comando. È indipendente dalla risoluzione dei segreti di configurazione; il Gateway risolve i SecretRef senza il coinvolgimento di alcuna skill.

## Note sulla sicurezza

- I valori segreti risolti tramite provider exec rimangono nella memoria del Gateway; le istantanee della configurazione e le risposte `config.get` oscurano i campi SecretRef.
- Non inserire mai valori segreti in `openclaw.json`, nei log o nelle chat. Mantenere i nomi degli elementi nella configurazione e i valori in 1Password.
- Il registro di controllo di 1Password mostra ogni lettura dell'account di servizio, rendendo pratiche la rotazione delle chiavi e l'analisi degli incidenti.

## Risoluzione dei problemi

- `command not found` o errori di avvio del processo: utilizzare il percorso assoluto di `op` e includere la relativa directory in `trustedDirs`.
- `op` viene risolto, ma le letture non riescono a causa di errori relativi ai collegamenti simbolici: impostare `allowSymlinkCommand: true` per le installazioni Homebrew.
- `account is not signed in`: per gli account di servizio, verificare che `OP_SERVICE_ACCOUNT_TOKEN` raggiunga il servizio Gateway e sia elencato in `passEnv`; per l'integrazione desktop, verificare che l'app sia in esecuzione e sbloccata.
- Prime letture lente: aumentare `timeoutMs` nel provider; gli avvii a freddo di `op` possono superare timeout rigidi sugli host sottoposti a carico elevato.
