---
summary: 'Hoe OpenClaw de ingebouwde agentruntime structureert: code-indeling, grenzen, resourcemanifesten en runtimeselectie.'
title: Architectuur van de agentruntime
x-i18n:
    generated_at: "2026-07-16T15:06:40Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 071a0cb076230ce02f2c2c1c21971379cf617f24faa8a9733570aae30a062019
    source_path: agent-runtime-architecture.md
    workflow: 16
---

OpenClaw beheert de ingebouwde agentruntime. Runtimecode bevindt zich onder `src/agents/`, model-/providertransport onder `src/llm/`, en contracten voor plugins worden beschikbaar gesteld via `openclaw/plugin-sdk/*`-barrels.

## Runtime-indeling

| Pad                                 | Beheert                                                                                                                                                                                                                   |
| ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/agents/embedded-agent-runner/` | Ingebouwde poginglus (`run.ts`, `run/`), modelselectie en providernormalisatie (`model*.ts`), aanvraagparameters per provider (`extra-params.*`), Compaction, en koppeling van transcript en sessie.                            |
| `src/agents/sessions/`              | Sessiepersistentie (`session-manager.ts`), resourcedetectie (`package-manager.ts`, `resource-loader.ts`), het laden van `extensions` binnen de sessie, prompttemplates, Skills, thema's en TUI-gebaseerde toolrenderers (`tools/`). |
| `packages/agent-core/`              | Herbruikbare agentkern (`@openclaw/agent-core`): agentlus, harnastypen, berichten, Compaction-helpers, prompttemplates, Skills en contracten voor sessieopslag.                                                           |
| `src/agents/runtime/`               | OpenClaw-facade die `@openclaw/agent-core` koppelt aan de LLM-runtime van de plugin-SDK en deze opnieuw exporteert, samen met lokale proxyhulpprogramma's.                                                                                             |
| `src/agents/agent-tools*.ts`        | Tooldefinities onder beheer van OpenClaw, parameterschema's, toolbeleid, adapters vóór en na toolaanroepen en bewerkingstools voor host/sandbox.                                                                                            |
| `src/agents/agent-hooks/`           | Ingebouwde runtimehooks: Compaction-beveiliging, Compaction-instructies, contextsnoeiing.                                                                                                                                   |
| `src/agents/harness/`               | Harnasregister, selectiebeleid en levenscyclus voor de ingebouwde en door plugins geregistreerde harnassen.                                                                                                                       |
| `src/llm/`                          | Model-/providerregister, transporthelpers en providerspecifieke streamimplementaties (`src/llm/providers/`).                                                                                                          |

## Grenzen

De kern roept de ingebouwde runtime aan via OpenClaw-modules en SDK-barrels; er zijn geen externe pakketten voor agentframeworks meer. Plugins gebruiken gedocumenteerde `openclaw/plugin-sdk/*`-ingangspunten en importeren geen interne onderdelen van `src/**`.

`@earendil-works/pi-tui` blijft een afhankelijkheid van derden: een toolkit voor terminalcomponenten die door de lokale TUI en renderers voor sessietools wordt gebruikt. Het internaliseren ervan zou een afzonderlijke vendoringsinspanning vereisen.

## Manifesten

Resourcepakketten declareren OpenClaw-resources in `package.json`-metadata. Vermeldingen zijn bestandspaden of globpatronen relatief ten opzichte van de pakketroot:

```json
{
  "openclaw": {
    "extensions": ["extensions/index.ts"],
    "skills": ["skills/*.md"],
    "prompts": ["prompts/*.md"],
    "themes": ["themes/*.json"]
  }
}
```

Resourcetypen die niet in een manifest worden vermeld, vallen terug op detectie van conventionele mappen `extensions/`, `skills/`, `prompts/` en `themes/`.

## Runtimeselectie

- De id van de ingebouwde runtime is `openclaw`. De verouderde alias `pi` wordt genormaliseerd naar `openclaw`; `codex-app-server` wordt genormaliseerd naar `codex`.
- Pluginharnassen registreren aanvullende runtime-id's (bijvoorbeeld `codex`).
- Runtimebeleid is model-/providergerichte `agentRuntime.id`-configuratie (de modelvermelding heeft voorrang op de providervermelding). Niet ingesteld of `default` wordt omgezet naar `auto`.
- `auto` selecteert een geregistreerd pluginharnas dat de effectieve providerroute ondersteunt, en anders de ingebouwde OpenClaw-runtime. Alleen een provider- of modelprefix selecteert nooit een harnas.
- OpenAI mag `codex` alleen impliciet selecteren voor een exacte officiële HTTPS-route voor Platform Responses of ChatGPT Responses zonder expliciet ingestelde aanvraagoverschrijving. Completions-adapters, aangepaste eindpunten en routes met expliciet ingesteld aanvraaggedrag blijven op `openclaw`; officiële HTTP-eindpunten met platte tekst worden geweigerd. Zie [Impliciete OpenAI-agentruntime](/nl/providers/openai#implicit-agent-runtime).

## Gerelateerd

- [Workflow van de OpenClaw-agentruntime](/nl/openclaw-agent-runtime)
- [Agentruntimes](/nl/concepts/agent-runtimes)
