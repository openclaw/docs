---
read_when:
    - Je wilt meerdere geïsoleerde agenten (werkruimten + routering + authenticatie)
summary: CLI-referentie voor `openclaw agents` (list/add/delete/bindings/bind/unbind/set identity)
title: Agenten
x-i18n:
    generated_at: "2026-04-29T22:30:07Z"
    model: gpt-5.5
    provider: openai
    source_hash: 46742a890a57cb1035a053f14fe574044e4a3d7dcc04812cd11c633bd808819b
    source_path: cli/agents.md
    workflow: 16
---

# `openclaw agents`

Beheer geïsoleerde agents (werkruimten + auth + routering).

Gerelateerd:

- [Multi-agentroutering](/nl/concepts/multi-agent)
- [Agentwerkruimte](/nl/concepts/agent-workspace)
- [Skills-configuratie](/nl/tools/skills-config): configuratie voor zichtbaarheid van Skills.

## Voorbeelden

```bash
openclaw agents list
openclaw agents list --bindings
openclaw agents add work --workspace ~/.openclaw/workspace-work
openclaw agents add ops --workspace ~/.openclaw/workspace-ops --bind telegram:ops --non-interactive
openclaw agents bindings
openclaw agents bind --agent work --bind telegram:ops
openclaw agents unbind --agent work --bind telegram:ops
openclaw agents set-identity --workspace ~/.openclaw/workspace --from-identity
openclaw agents set-identity --agent main --avatar avatars/openclaw.png
openclaw agents delete work
```

## Routeringsbindingen

Gebruik routeringsbindingen om binnenkomend kanaalverkeer vast te zetten op een specifieke agent.

Als je ook verschillende zichtbare Skills per agent wilt, configureer dan `agents.defaults.skills` en `agents.list[].skills` in `openclaw.json`. Zie [Skills-configuratie](/nl/tools/skills-config) en [Configuratiereferentie](/nl/gateway/config-agents#agents-defaults-skills).

Bindingen weergeven:

```bash
openclaw agents bindings
openclaw agents bindings --agent work
openclaw agents bindings --json
```

Bindingen toevoegen:

```bash
openclaw agents bind --agent work --bind telegram:ops --bind discord:guild-a
```

Als je `accountId` weglaat (`--bind <channel>`), lost OpenClaw deze op vanuit kanaalstandaarden en Plugin-instelhooks wanneer beschikbaar.

Als je `--agent` weglaat voor `bind` of `unbind`, richt OpenClaw zich op de huidige standaardagent.

### Gedrag van bindingsbereik

- Een binding zonder `accountId` komt alleen overeen met het standaardaccount van het kanaal.
- `accountId: "*"` is de kanaalbrede fallback (alle accounts) en is minder specifiek dan een expliciete accountbinding.
- Als dezelfde agent al een overeenkomende kanaalbinding zonder `accountId` heeft, en je later bindt met een expliciete of opgeloste `accountId`, werkt OpenClaw die bestaande binding op zijn plaats bij in plaats van een duplicaat toe te voegen.

Voorbeeld:

```bash
# initial channel-only binding
openclaw agents bind --agent work --bind telegram

# later upgrade to account-scoped binding
openclaw agents bind --agent work --bind telegram:ops
```

Na de upgrade is routering voor die binding beperkt tot `telegram:ops`. Als je ook routering voor het standaardaccount wilt, voeg die dan expliciet toe (bijvoorbeeld `--bind telegram:default`).

Bindingen verwijderen:

```bash
openclaw agents unbind --agent work --bind telegram:ops
openclaw agents unbind --agent work --all
```

`unbind` accepteert ofwel `--all` of een of meer `--bind`-waarden, niet beide.

## Opdrachtoppervlak

### `agents`

`openclaw agents` uitvoeren zonder subopdracht is gelijk aan `openclaw agents list`.

### `agents list`

Opties:

- `--json`
- `--bindings`: neem volledige routeringsregels op, niet alleen aantallen/samenvattingen per agent

### `agents add [name]`

Opties:

- `--workspace <dir>`
- `--model <id>`
- `--agent-dir <dir>`
- `--bind <channel[:accountId]>` (herhaalbaar)
- `--non-interactive`
- `--json`

Opmerkingen:

- Het doorgeven van expliciete add-vlaggen schakelt de opdracht over naar het niet-interactieve pad.
- Niet-interactieve modus vereist zowel een agentnaam als `--workspace`.
- `main` is gereserveerd en kan niet worden gebruikt als de nieuwe agent-id.
- In interactieve modus kopieert auth-seeding alleen draagbare statische profielen
  (standaard `api_key` en statische `token`). OAuth-profielen met refresh-tokens blijven
  alleen beschikbaar via read-through-overerving vanuit de echte `main`-agentopslag.
  Als de geconfigureerde standaardagent niet `main` is, meld je dan apart aan voor OAuth-
  profielen op de nieuwe agent.

### `agents bindings`

Opties:

- `--agent <id>`
- `--json`

### `agents bind`

Opties:

- `--agent <id>` (standaard de huidige standaardagent)
- `--bind <channel[:accountId]>` (herhaalbaar)
- `--json`

### `agents unbind`

Opties:

- `--agent <id>` (standaard de huidige standaardagent)
- `--bind <channel[:accountId]>` (herhaalbaar)
- `--all`
- `--json`

### `agents delete <id>`

Opties:

- `--force`
- `--json`

Opmerkingen:

- `main` kan niet worden verwijderd.
- Zonder `--force` is interactieve bevestiging vereist.
- Werkruimte-, agentstatus- en sessietranscriptmappen worden naar de prullenmand verplaatst, niet definitief verwijderd.
- Als de werkruimte van een andere agent hetzelfde pad is, binnen deze werkruimte ligt of deze werkruimte bevat,
  blijft de werkruimte behouden en rapporteert `--json` `workspaceRetained`,
  `workspaceRetainedReason` en `workspaceSharedWith`.

## Identiteitsbestanden

Elke agentwerkruimte kan een `IDENTITY.md` bevatten in de hoofdmap van de werkruimte:

- Voorbeeldpad: `~/.openclaw/workspace/IDENTITY.md`
- `set-identity --from-identity` leest vanuit de hoofdmap van de werkruimte (of een expliciet `--identity-file`)

Avatarpaden worden relatief aan de hoofdmap van de werkruimte opgelost.

## Identiteit instellen

`set-identity` schrijft velden naar `agents.list[].identity`:

- `name`
- `theme`
- `emoji`
- `avatar` (werkruimterelatief pad, http(s)-URL of data-URI)

Opties:

- `--agent <id>`
- `--workspace <dir>`
- `--identity-file <path>`
- `--from-identity`
- `--name <name>`
- `--theme <theme>`
- `--emoji <emoji>`
- `--avatar <value>`
- `--json`

Opmerkingen:

- `--agent` of `--workspace` kan worden gebruikt om de doelagent te selecteren.
- Als je vertrouwt op `--workspace` en meerdere agents die werkruimte delen, mislukt de opdracht en wordt gevraagd `--agent` door te geven.
- Wanneer er geen expliciete identiteitsvelden zijn opgegeven, leest de opdracht identiteitsgegevens uit `IDENTITY.md`.

Laden vanuit `IDENTITY.md`:

```bash
openclaw agents set-identity --workspace ~/.openclaw/workspace --from-identity
```

Velden expliciet overschrijven:

```bash
openclaw agents set-identity --agent main --name "OpenClaw" --emoji "🦞" --avatar avatars/openclaw.png
```

Configuratievoorbeeld:

```json5
{
  agents: {
    list: [
      {
        id: "main",
        identity: {
          name: "OpenClaw",
          theme: "space lobster",
          emoji: "🦞",
          avatar: "avatars/openclaw.png",
        },
      },
    ],
  },
}
```

## Gerelateerd

- [CLI-referentie](/nl/cli)
- [Multi-agentroutering](/nl/concepts/multi-agent)
- [Agentwerkruimte](/nl/concepts/agent-workspace)
