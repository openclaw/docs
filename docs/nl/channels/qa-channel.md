---
read_when:
    - Je koppelt het synthetische QA-transport aan een lokale of CI-testrun
    - Je hebt de meegeleverde qa-channel-configuratie-interface nodig
    - Je werkt iteratief aan end-to-end QA-automatisering
summary: Synthetische kanaal-Plugin van Slack-klasse voor deterministische OpenClaw-QA-scenario's
title: QA-kanaal
x-i18n:
    generated_at: "2026-04-29T22:27:33Z"
    model: gpt-5.5
    provider: openai
    source_hash: e1de1f52da1a14c845cf2a536ddc6f36ab52ed6364f68d9ece32ce272e2a2f96
    source_path: channels/qa-channel.md
    workflow: 16
---

`qa-channel` is een gebundeld synthetisch berichttransport voor geautomatiseerde OpenClaw-QA. Het is geen productiekanaal — het bestaat om dezelfde kanaal-Plugin-grens te testen die echte transporten gebruiken, terwijl de status deterministisch en volledig inspecteerbaar blijft.

## Wat het doet

- Slack-achtige doelgrammatica:
  - `dm:<user>`
  - `channel:<room>`
  - `thread:<room>/<thread>`
- HTTP-ondersteunde synthetische bus voor injectie van inkomende berichten, vastlegging van uitgaande transcripties, aanmaken van threads, reacties, bewerkingen, verwijderingen en zoek-/leesacties.
- Hostzijdige zelfcontrolerunner die een Markdown-rapport schrijft naar `.artifacts/qa-e2e/`.

## Configuratie

```json
{
  "channels": {
    "qa-channel": {
      "baseUrl": "http://127.0.0.1:43123",
      "botUserId": "openclaw",
      "botDisplayName": "OpenClaw QA",
      "allowFrom": ["*"],
      "pollTimeoutMs": 1000
    }
  }
}
```

Accountsleutels:

- `enabled` — hoofdschakelaar voor dit account.
- `name` — optioneel weergavelabel.
- `baseUrl` — URL van de synthetische bus.
- `botUserId` — Matrix-achtige gebruikers-id van de bot die in de doelgrammatica wordt gebruikt.
- `botDisplayName` — weergavenaam voor uitgaande berichten.
- `pollTimeoutMs` — wachttijdvenster voor long-polling. Geheel getal tussen 100 en 30000.
- `allowFrom` — allowlist voor afzenders (gebruikers-id's of `"*"`).
- `defaultTo` — fallback-doel wanneer er geen doel is opgegeven.
- `actions.messages` / `actions.reactions` / `actions.search` / `actions.threads` — tool-gating per actie.

Multi-accountsleutels op het hoogste niveau:

- `accounts` — record met benoemde overschrijvingen per account, gesleuteld op account-id.
- `defaultAccount` — voorkeursaccount-id wanneer er meerdere zijn geconfigureerd.

## Uitvoerders

Hostzijdige zelfcontrole (schrijft een Markdown-rapport onder `.artifacts/qa-e2e/`):

```bash
pnpm qa:e2e
```

Dit loopt via `qa-lab`, start de QA-bus in de repo, start de gebundelde `qa-channel` runtime-slice en voert een deterministische zelfcontrole uit.

Volledige scenarioreeks met repo-ondersteuning:

```bash
pnpm openclaw qa suite
```

Voert scenario's parallel uit tegen de QA-Gateway-lane. Zie [QA-overzicht](/nl/concepts/qa-e2e-automation) voor scenario's, profielen en providermodi.

Docker-ondersteunde QA-site (Gateway + QA Lab-debugger-UI in één stack):

```bash
pnpm qa:lab:up
```

Bouwt de QA-site, start de Docker-ondersteunde Gateway + QA Lab-stack en print de QA Lab-URL. Van daaruit kun je scenario's kiezen, de modellane kiezen, afzonderlijke runs starten en resultaten live bekijken. De QA Lab-debugger staat los van de meegeleverde Control UI-bundel.

## Gerelateerd

- [QA-overzicht](/nl/concepts/qa-e2e-automation) — volledige stack, transportadapters, scenario-authoring
- [Matrix-QA](/nl/concepts/qa-matrix) — voorbeeld van een live-transportrunner die een echt kanaal aanstuurt
- [Koppeling](/nl/channels/pairing)
- [Groepen](/nl/channels/groups)
- [Kanalenoverzicht](/nl/channels)
