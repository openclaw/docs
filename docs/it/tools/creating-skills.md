---
read_when:
    - Stai creando un nuovo Skills personalizzato nel tuo workspace
    - Hai bisogno di un flusso iniziale rapido per Skills basati su SKILL.md
summary: Creare e testare Skills personalizzati del workspace con SKILL.md
title: Creazione di Skills
x-i18n:
    generated_at: "2026-04-24T09:04:54Z"
    model: gpt-5.4
    provider: openai
    source_hash: df9249e14936c65143580a6618679cf2d79a2960390e5c7afc5dbea1a9a6e045
    source_path: tools/creating-skills.md
    workflow: 15
---

Gli Skills insegnano all'agente come e quando usare gli strumenti. Ogni Skills è una directory
che contiene un file `SKILL.md` con frontmatter YAML e istruzioni markdown.

Per sapere come gli Skills vengono caricati e prioritizzati, vedi [Skills](/it/tools/skills).

## Crea il tuo primo Skills

<Steps>
  <Step title="Crea la directory dello Skills">
    Gli Skills vivono nel tuo workspace. Crea una nuova cartella:

    ```bash
    mkdir -p ~/.openclaw/workspace/skills/hello-world
    ```

  </Step>

  <Step title="Scrivi SKILL.md">
    Crea `SKILL.md` dentro quella directory. Il frontmatter definisce i metadati,
    e il corpo markdown contiene istruzioni per l'agente.

    ```markdown
    ---
    name: hello_world
    description: A simple skill that says hello.
    ---

    # Hello World Skill

    When the user asks for a greeting, use the `echo` tool to say
    "Hello from your custom skill!".
    ```

  </Step>

  <Step title="Aggiungi strumenti (facoltativo)">
    Puoi definire schemi di strumenti personalizzati nel frontmatter oppure istruire l'agente
    a usare strumenti di sistema esistenti (come `exec` o `browser`). Gli Skills possono anche
    essere distribuiti dentro i Plugin insieme agli strumenti che documentano.

  </Step>

  <Step title="Carica lo Skills">
    Avvia una nuova sessione così OpenClaw rileva lo Skills:

    ```bash
    # Dalla chat
    /new

    # Oppure riavvia il gateway
    openclaw gateway restart
    ```

    Verifica che lo Skills sia stato caricato:

    ```bash
    openclaw skills list
    ```

  </Step>

  <Step title="Testalo">
    Invia un messaggio che dovrebbe attivare lo Skills:

    ```bash
    openclaw agent --message "give me a greeting"
    ```

    Oppure chatta semplicemente con l'agente e chiedi un saluto.

  </Step>
</Steps>

## Riferimento dei metadati dello Skills

Il frontmatter YAML supporta questi campi:

| Campo                               | Obbligatorio | Descrizione                                 |
| ----------------------------------- | ------------ | ------------------------------------------- |
| `name`                              | Sì           | Identificatore univoco (snake_case)         |
| `description`                       | Sì           | Descrizione su una riga mostrata all'agente |
| `metadata.openclaw.os`              | No           | Filtro OS (`["darwin"]`, `["linux"]`, ecc.) |
| `metadata.openclaw.requires.bins`   | No           | Binari richiesti nel PATH                   |
| `metadata.openclaw.requires.config` | No           | Chiavi di configurazione richieste          |

## Best practice

- **Sii conciso** — istruisci il modello su _cosa_ fare, non su come essere un'AI
- **Sicurezza prima di tutto** — se il tuo Skills usa `exec`, assicurati che i prompt non consentano injection arbitrarie di comandi da input non attendibile
- **Testa in locale** — usa `openclaw agent --message "..."` per testare prima di condividere
- **Usa ClawHub** — esplora e contribuisci agli Skills su [ClawHub](https://clawhub.ai)

## Dove vivono gli Skills

| Posizione                       | Precedenza | Ambito                |
| ------------------------------- | ---------- | --------------------- |
| `\<workspace\>/skills/`         | Più alta   | Per agente            |
| `\<workspace\>/.agents/skills/` | Alta       | Per agente del workspace |
| `~/.agents/skills/`             | Media      | Profilo agente condiviso |
| `~/.openclaw/skills/`           | Media      | Condiviso (tutti gli agenti) |
| Bundled (distribuiti con OpenClaw) | Bassa   | Globale               |
| `skills.load.extraDirs`         | Più bassa  | Cartelle condivise personalizzate |

## Correlati

- [Riferimento Skills](/it/tools/skills) — caricamento, precedenza e regole di gating
- [Configurazione Skills](/it/tools/skills-config) — schema di configurazione `skills.*`
- [ClawHub](/it/tools/clawhub) — registro pubblico degli Skills
- [Creazione di Plugin](/it/plugins/building-plugins) — i Plugin possono includere Skills
