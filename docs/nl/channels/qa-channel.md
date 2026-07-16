---
read_when:
    - Je koppelt het synthetische QA-transport aan een lokale of CI-testrun
    - Je hebt het gebundelde qa-channel-configuratieoppervlak nodig
    - Je werkt iteratief aan end-to-end QA-automatisering
summary: Synthetische kanaalplugin van Slack-klasse voor deterministische OpenClaw-QA-scenario's
title: QA-kanaal
x-i18n:
    generated_at: "2026-07-16T15:21:23Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: a43c35e197116a6bd44b238010eb508aed23dea99ab872d10e6fc853b5f4d4a7
    source_path: channels/qa-channel.md
    workflow: 16
---

`qa-channel` is een repo-lokaal synthetisch berichtentransport voor geautomatiseerde OpenClaw-QA (`extensions/qa-channel`, privépakket, uitgesloten van verpakte installaties). Het is geen productiekanaal - het bestaat om dezelfde grens van de kanaalplugin te testen die door echte transporten wordt gebruikt, terwijl de status deterministisch en volledig inspecteerbaar blijft.

## Wat het doet

- Doelgrammatica van Slack-klasse:
  - `dm:<user>`
  - `channel:<room>`
  - `group:<room>`
  - `thread:<room>/<thread>`
- Gedeelde `channel:`- en `group:`-gesprekken worden aan agents gepresenteerd als groeps-/kanaalruimtebeurten, zodat ze hetzelfde routeringsbeleid voor zichtbare antwoorden en berichttools testen dat wordt gebruikt door Discord, Slack, Telegram en vergelijkbare transporten.
- HTTP-ondersteunde synthetische bus voor het injecteren van inkomende berichten, vastleggen van uitgaande transcripties, maken van threads, reacties, bewerkingen, verwijderingen en zoek-/leesacties.
- Zelfcontrolerunner aan de hostzijde die een Markdown-rapport schrijft naar `.artifacts/qa-e2e/`.

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
- `baseUrl` - URL van de synthetische bus. Het account geldt als geconfigureerd zodra dit is ingesteld.
- `botUserId` - synthetische gebruikers-id van de bot die in de doelgrammatica wordt gebruikt (standaard: `openclaw`).
- `botDisplayName` - weergavenaam voor uitgaande berichten (standaard: `OpenClaw QA`).
- `pollTimeoutMs` - wachttijdvenster voor long-polling. Geheel getal tussen 100 en 30000 (standaard: 1000).
- `allowFrom` - toelatingslijst voor afzenders (gebruikers-id's of `"*"`; standaard: `["*"]`). Privéberichten vallen
  altijd onder het `open`-beleid; het groepsbeleid met toelatingslijst gebruikt ook deze synthetische
  afzender-id's.
- `groupPolicy` - beleid voor gedeelde ruimten: `"open"` (standaard), `"allowlist"` of
  `"disabled"`.
- `groupAllowFrom` - optionele toelatingslijst voor afzenders in gedeelde ruimten. Wanneer deze onder
  `"allowlist"` is weggelaten, valt QA Channel terug op `allowFrom`.
- `groups.<room>.requireMention` - vereist een vermelding van de bot voordat in een
  specifieke groeps-/kanaalruimte wordt geantwoord (standaard: false). `groups."*"` stelt de standaardwaarde in;
  `tools` / `toolsBySender` per ruimte stellen overschrijvingen van het toolbeleid in.
- `defaultTo` - terugvaldoel wanneer er geen doel is opgegeven.
- `actions.messages` / `actions.reactions` / `actions.search` / `actions.threads` - toolbeperking per actie.

Sleutels voor meerdere accounts op het hoogste niveau:

- `accounts` - verzameling benoemde overschrijvingen per account, geïndexeerd op account-id.
- `defaultAccount` - voorkeursaccount-id wanneer er meerdere zijn geconfigureerd.

## Runners

Zelfcontrole aan de hostzijde (schrijft een Markdown-rapport onder `.artifacts/qa-e2e/`):

```bash
pnpm qa:e2e
```

Dit wordt gerouteerd via `qa-lab`, start de QA-bus in de repo, start het `qa-channel`-runtimeonderdeel op en voert een deterministische zelfcontrole uit.

Volledige, door de repo ondersteunde scenariosuite:

```bash
pnpm openclaw qa suite
```

Voert scenario's parallel uit op de QA-gatewaylane. Zie [QA-overzicht](/nl/concepts/qa-e2e-automation) voor scenario's, profielen en providermodi.

Door Docker ondersteunde QA-site (gateway + QA Lab-debugger-UI in één stack):

```bash
pnpm qa:lab:up
```

Bouwt de QA-site, start de door Docker ondersteunde gateway + QA Lab-stack en toont de QA Lab-URL. Van daaruit kun je scenario's selecteren, de modellane kiezen, afzonderlijke uitvoeringen starten en de resultaten live bekijken. De QA Lab-debugger staat los van de meegeleverde Control UI-bundel.

## Gerelateerd

- [QA-overzicht](/nl/concepts/qa-e2e-automation) - algemene stack, transportadapters, Matrix-profielen en het schrijven van scenario's
- [Koppelen](/nl/channels/pairing)
- [Groepen](/nl/channels/groups)
- [Kanalenoverzicht](/nl/channels)
