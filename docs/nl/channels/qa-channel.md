---
read_when:
    - Je koppelt het synthetische QA-transport aan een lokale of CI-testuitvoering
    - Je hebt het meegeleverde qa-channel-configuratieoppervlak nodig
    - Je werkt iteratief aan eind-tot-eind-QA-automatisering
summary: Synthetische kanaalplugin van Slack-klasse voor deterministische OpenClaw-QA-scenario's
title: QA-kanaal
x-i18n:
    generated_at: "2026-05-01T11:15:15Z"
    model: gpt-5.5
    provider: openai
    source_hash: efe057812de1fbc6d89d2b6d5860cd6af4648c3e86913efa3a69267c4e8c57b4
    source_path: channels/qa-channel.md
    workflow: 16
---

`qa-channel` is een gebundeld synthetisch berichtentransport voor geautomatiseerde OpenClaw-QA. Het is geen productiekanaal — het bestaat om dezelfde grens van kanaalplugins te oefenen die echte transporten gebruiken, terwijl de toestand deterministisch en volledig inspecteerbaar blijft.

## Wat het doet

- Slack-achtige doelgrammatica:
  - `dm:<user>`
  - `channel:<room>`
  - `group:<room>`
  - `thread:<room>/<thread>`
- Gedeelde `channel:`- en `group:`-gesprekken worden aan agents getoond als groeps-/kanaalruimtet beurten, zodat ze hetzelfde routeringsbeleid voor zichtbare antwoorden en berichttools oefenen dat wordt gebruikt door Discord, Slack, Telegram en vergelijkbare transporten.
- Synthetische bus met HTTP-backend voor injectie van inkomende berichten, vastlegging van uitgaande transcripts, threadaanmaak, reacties, bewerkingen, verwijderingen en zoek-/leesacties.
- Host-side self-check-runner die een Markdown-rapport schrijft naar `.artifacts/qa-e2e/`.

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
- `botUserId` — Matrix-achtige botgebruikers-id die in de doelgrammatica wordt gebruikt.
- `botDisplayName` — weergavenaam voor uitgaande berichten.
- `pollTimeoutMs` — wachttijdvenster voor long polling. Geheel getal tussen 100 en 30000.
- `allowFrom` — allowlist voor afzenders (gebruikers-id's of `"*"`).
- `defaultTo` — fallbackdoel wanneer er geen wordt opgegeven.
- `actions.messages` / `actions.reactions` / `actions.search` / `actions.threads` — toolbeperking per actie.

Multi-accountsleutels op het hoogste niveau:

- `accounts` — record met benoemde overrides per account, gesleuteld op account-id.
- `defaultAccount` — voorkeursaccount-id wanneer er meerdere zijn geconfigureerd.

## Runners

Host-side self-check (schrijft een Markdown-rapport onder `.artifacts/qa-e2e/`):

```bash
pnpm qa:e2e
```

Dit routeert via `qa-lab`, start de QA-bus in de repo, boot de gebundelde runtime-slice van `qa-channel` en voert een deterministische self-check uit.

Volledige scenarioreeks met repo-backend:

```bash
pnpm openclaw qa suite
```

Voert scenario's parallel uit tegen de QA-Gateway-lane. Zie [QA-overzicht](/nl/concepts/qa-e2e-automation) voor scenario's, profielen en providermodi.

QA-site met Docker-backend (Gateway + QA Lab-debugger-UI in één stack):

```bash
pnpm qa:lab:up
```

Bouwt de QA-site, start de Gateway met Docker-backend + QA Lab-stack en print de QA Lab-URL. Van daaruit kun je scenario's kiezen, de modellane selecteren, afzonderlijke runs starten en resultaten live bekijken. De QA Lab-debugger staat los van de geleverde Control UI-bundel.

## Gerelateerd

- [QA-overzicht](/nl/concepts/qa-e2e-automation) — volledige stack, transportadapters, scenario-authoring
- [Matrix-QA](/nl/concepts/qa-matrix) — voorbeeld van een live-transportrunner die een echt kanaal aanstuurt
- [Koppelen](/nl/channels/pairing)
- [Groepen](/nl/channels/groups)
- [Kanalenoverzicht](/nl/channels)
