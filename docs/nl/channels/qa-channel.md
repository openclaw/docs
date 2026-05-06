---
read_when:
    - Je integreert het synthetische QA-transport in een lokale of CI-testrun
    - Je hebt het meegeleverde qa-channel-configuratieoppervlak nodig
    - Je werkt iteratief aan eind-tot-eind-QA-automatisering
summary: Synthetische Slack-klasse kanaal-Plugin voor deterministische OpenClaw-QA-scenario's
title: QA-kanaal
x-i18n:
    generated_at: "2026-05-06T09:04:00Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1990b64d8a3ed158b11fc08742f774c5355ee25b68402ec447b92316109ac2f2
    source_path: channels/qa-channel.md
    workflow: 16
---

`qa-channel` is een gebundeld synthetisch berichtentransport voor geautomatiseerde OpenClaw-QA. Het is geen productiekanaal - het bestaat om dezelfde kanaal-Plugin-grens te testen die door echte transporten wordt gebruikt, terwijl de status deterministisch en volledig inspecteerbaar blijft.

## Wat het doet

- Doelgrammatica van Slack-klasse:
  - `dm:<user>`
  - `channel:<room>`
  - `group:<room>`
  - `thread:<room>/<thread>`
- Gedeelde `channel:`- en `group:`-gesprekken worden aan agents gepresenteerd als groeps-/kanaalkamerbeurten, zodat ze hetzelfde routeringsbeleid voor zichtbare antwoorden en berichtentools testen dat wordt gebruikt door Discord, Slack, Telegram en vergelijkbare transporten.
- Synthetische bus met HTTP-backend voor injectie van inkomende berichten, vastlegging van uitgaande transcripties, threadaanmaak, reacties, bewerkingen, verwijderingen en zoek-/leesacties.
- Zelftest-runner aan hostzijde die een Markdown-rapport schrijft naar `.artifacts/qa-e2e/`.

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

- `enabled` - hoofdschakelaar voor dit account.
- `name` - optioneel weergavelabel.
- `baseUrl` - URL van de synthetische bus.
- `botUserId` - botgebruikers-ID in Matrix-stijl die wordt gebruikt in de doelgrammatica.
- `botDisplayName` - weergavenaam voor uitgaande berichten.
- `pollTimeoutMs` - wachttijdvenster voor long-polling. Geheel getal tussen 100 en 30000.
- `allowFrom` - allowlist voor afzenders (gebruikers-ID's of `"*"`).
- `defaultTo` - fallbackdoel wanneer er geen doel is opgegeven.
- `actions.messages` / `actions.reactions` / `actions.search` / `actions.threads` - toolgating per actie.

Multi-accountsleutels op het hoogste niveau:

- `accounts` - record van benoemde overschrijvingen per account, gesleuteld op account-ID.
- `defaultAccount` - voorkeursaccount-ID wanneer er meerdere zijn geconfigureerd.

## Runners

Zelftest aan hostzijde (schrijft een Markdown-rapport onder `.artifacts/qa-e2e/`):

```bash
pnpm qa:e2e
```

Dit routeert via `qa-lab`, start de QA-bus in de repo, start de gebundelde runtime-slice van `qa-channel` en voert een deterministische zelftest uit.

Volledige scenario-suite met repo-backend:

```bash
pnpm openclaw qa suite
```

Voert scenario's parallel uit tegen de QA-Gateway-lane. Zie [QA-overzicht](/nl/concepts/qa-e2e-automation) voor scenario's, profielen en providermodi.

QA-site met Docker-backend (Gateway + QA Lab-debugger-UI in één stack):

```bash
pnpm qa:lab:up
```

Bouwt de QA-site, start de Gateway + QA Lab-stack met Docker-backend en print de QA Lab-URL. Van daaruit kun je scenario's kiezen, de modellane kiezen, afzonderlijke runs starten en resultaten live bekijken. De QA Lab-debugger staat los van de meegeleverde Control UI-bundel.

## Gerelateerd

- [QA-overzicht](/nl/concepts/qa-e2e-automation) - algemene stack, transportadapters, scenario-authoring
- [Matrix-QA](/nl/concepts/qa-matrix) - voorbeeld van een live-transportrunner die een echt kanaal aanstuurt
- [Koppelen](/nl/channels/pairing)
- [Groepen](/nl/channels/groups)
- [Kanalenoverzicht](/nl/channels)
