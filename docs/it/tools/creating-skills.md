---
read_when:
    - Stai creando una nuova Skill personalizzata nel tuo workspace
    - Hai bisogno di un rapido flusso di lavoro introduttivo per Skills basate su SKILL.md
summary: Crea e testa Skills personalizzate del workspace con SKILL.md
title: Creazione delle Skills
x-i18n:
    generated_at: "2026-04-05T14:05:59Z"
    model: gpt-5.4
    provider: openai
    source_hash: 747cebc5191b96311d1d6760bede1785a099acd7633a0b88de6b7882b57e1db6
    source_path: tools/creating-skills.md
    workflow: 15
---

# Creazione delle Skills

Le Skills insegnano all'agente come e quando usare gli strumenti. Ogni Skill è una directory
che contiene un file `SKILL.md` con frontmatter YAML e istruzioni in markdown.

Per sapere come le Skills vengono caricate e messe in priorità, vedi [Skills](/tools/skills).

## Crea la tua prima Skill

<Steps>
  <Step title="Crea la directory della Skill">
    Le Skills si trovano nel tuo workspace. Crea una nuova cartella:

    ```bash
    mkdir -p ~/.openclaw/workspace/skills/hello-world
    ```

  </Step>

  <Step title="Scrivi SKILL.md">
    Crea `SKILL.md` all'interno di quella directory. Il frontmatter definisce i metadati,
    e il corpo markdown contiene le istruzioni per l'agente.

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
    a usare strumenti di sistema esistenti (come `exec` o `browser`). Le Skills possono anche
    essere incluse nei plugin insieme agli strumenti che documentano.

  </Step>

  <Step title="Carica la Skill">
    Avvia una nuova sessione in modo che OpenClaw rilevi la Skill:

    ```bash
    # Dalla chat
    /new

    # Oppure riavvia il gateway
    openclaw gateway restart
    ```

    Verifica che la Skill sia stata caricata:

    ```bash
    openclaw skills list
    ```

  </Step>

  <Step title="Testala">
    Invia un messaggio che dovrebbe attivare la Skill:

    ```bash
    openclaw agent --message "give me a greeting"
    ```

    Oppure chatta semplicemente con l'agente e chiedi un saluto.

  </Step>
</Steps>

## Riferimento dei metadati della Skill

Il frontmatter YAML supporta questi campi:

| Field                               | Required | Description                                 |
| ----------------------------------- | -------- | ------------------------------------------- |
| `name`                              | Yes      | Identificatore univoco (snake_case)         |
| `description`                       | Yes      | Descrizione in una riga mostrata all'agente |
| `metadata.openclaw.os`              | No       | Filtro OS (`["darwin"]`, `["linux"]`, ecc.) |
| `metadata.openclaw.requires.bins`   | No       | Binari richiesti nel PATH                   |
| `metadata.openclaw.requires.config` | No       | Chiavi di configurazione richieste          |

## Best practice

- **Sii conciso** — istruisci il modello su _cosa_ fare, non su come comportarsi come un'IA
- **Sicurezza prima di tutto** — se la tua Skill usa `exec`, assicurati che i prompt non consentano iniezioni arbitrarie di comandi da input non attendibili
- **Testa localmente** — usa `openclaw agent --message "..."` per testare prima di condividere
- **Usa ClawHub** — esplora e contribuisci alle Skills su [ClawHub](https://clawhub.ai)

## Dove si trovano le Skills

| Location                        | Precedence | Scope                 |
| ------------------------------- | ---------- | --------------------- |
| `\<workspace\>/skills/`         | Massima    | Per agente            |
| `\<workspace\>/.agents/skills/` | Alta       | Agente per workspace  |
| `~/.agents/skills/`             | Media      | Profilo agente condiviso |
| `~/.openclaw/skills/`           | Media      | Condiviso (tutti gli agenti) |
| Bundled (shipped with OpenClaw) | Bassa      | Globale               |
| `skills.load.extraDirs`         | Minima     | Cartelle condivise personalizzate |

## Correlati

- [Riferimento Skills](/tools/skills) — caricamento, priorità e regole di gating
- [Configurazione Skills](/tools/skills-config) — schema di configurazione `skills.*`
- [ClawHub](/tools/clawhub) — registro pubblico delle Skills
- [Creare plugin](/it/plugins/building-plugins) — i plugin possono includere Skills
