---
read_when:
    - Je wilt meerdere geïsoleerde agents (werkruimten + routering + authenticatie)
summary: CLI-referentie voor `openclaw agents` (list/add/delete/bindings/bind/unbind/set identity)
title: Agenten
x-i18n:
    generated_at: "2026-06-27T17:18:01Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7905bc2465c48b5bfee4ce90fdf96dcd92b304a9fb29de93f8f49afdff0e6672
    source_path: cli/agents.md
    workflow: 16
---

# `openclaw agents`

Beheer geïsoleerde agents (werkruimten + authenticatie + routering).

Gerelateerd:

- [Routering met meerdere agents](/nl/concepts/multi-agent)
- [Agentwerkruimte](/nl/concepts/agent-workspace)
- [Skills-configuratie](/nl/tools/skills-config): configuratie voor zichtbaarheid van Skills.

## Voorbeelden

```bash
openclaw agents list
openclaw agents list --bindings
openclaw agents add work --workspace ~/.openclaw/workspace-work
openclaw agents add work --workspace ~/.openclaw/workspace-work --bind telegram:*
openclaw agents add ops --workspace ~/.openclaw/workspace-ops --bind telegram:ops --non-interactive
openclaw agents bindings
openclaw agents bind --agent work --bind telegram:ops
openclaw agents unbind --agent work --bind telegram:ops
openclaw agents set-identity --workspace ~/.openclaw/workspace --from-identity
openclaw agents set-identity --agent main --avatar avatars/openclaw.png
openclaw agents delete work
```

## Routeringsbindingen

Gebruik routeringsbindingen om inkomend kanaalverkeer vast te zetten op een specifieke agent.

Als je ook per agent verschillende zichtbare Skills wilt, configureer dan `agents.defaults.skills` en `agents.list[].skills` in `openclaw.json`. Zie [Skills-configuratie](/nl/tools/skills-config) en [Configuratiereferentie](/nl/gateway/config-agents#agents-defaults-skills).

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

Je kunt ook bindingen toevoegen wanneer je een agent maakt:

```bash
openclaw agents add work --workspace ~/.openclaw/workspace-work --bind telegram:* --bind discord:*
```

Als je `accountId` (`--bind <channel>`) weglaat, leidt OpenClaw die af uit Plugin-installatiehooks, geforceerde accountbinding of het geconfigureerde aantal accounts van het kanaal.

Als je `--agent` weglaat voor `bind` of `unbind`, gebruikt OpenClaw de huidige standaardagent als doel.

### `--bind`-indeling

| Indeling                     | Betekenis                                                                                         |
| ---------------------------- | ------------------------------------------------------------------------------------------------- |
| `--bind <channel>:*`         | Koppel alle accounts op het kanaal.                                                               |
| `--bind <channel>:<account>` | Koppel één account.                                                                               |
| `--bind <channel>`           | Koppel alleen het standaardaccount, tenzij de CLI veilig een Plugin-specifiek accountbereik kan afleiden. |

### Gedrag van bindingsbereik

- Een opgeslagen binding zonder `accountId` koppelt alleen het standaardaccount van het kanaal.
- `accountId: "*"` is de kanaalbrede fallback (alle accounts) en is minder specifiek dan een expliciete accountbinding.
- Als dezelfde agent al een overeenkomende kanaalbinding zonder `accountId` heeft, en je later bindt met een expliciete of afgeleide `accountId`, werkt OpenClaw die bestaande binding ter plekke bij in plaats van een duplicaat toe te voegen.

Voorbeelden:

```bash
# match all accounts on the channel
openclaw agents bind --agent work --bind telegram:*

# match a specific account
openclaw agents bind --agent work --bind telegram:ops

# initial channel-only binding
openclaw agents bind --agent work --bind telegram

# later upgrade to account-scoped binding
openclaw agents bind --agent work --bind telegram:alerts
```

Na de upgrade is routering voor die binding beperkt tot `telegram:alerts`. Als je ook routering voor het standaardaccount wilt, voeg die dan expliciet toe (bijvoorbeeld `--bind telegram:default`).

Bindingen verwijderen:

```bash
openclaw agents unbind --agent work --bind telegram:ops
openclaw agents unbind --agent work --all
```

`unbind` accepteert óf `--all` óf een of meer `--bind`-waarden, niet beide.

## Command surface

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
- `main` is gereserveerd en kan niet worden gebruikt als nieuwe agent-id.
- In interactieve modus kopieert het seeden van authenticatie alleen overdraagbare statische profielen
  (standaard `api_key` en statische `token`). OAuth-profielen met refresh-token blijven
  alleen beschikbaar via read-through-overerving uit de echte `main`-agentopslag.
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
- Werkruimte-, agentstatus- en sessietranscriptmappen worden naar de Prullenmand verplaatst, niet definitief verwijderd.
- Wanneer de Gateway bereikbaar is, wordt verwijdering via de Gateway verzonden, zodat config- en sessieopslagopschoning dezelfde writer gebruiken als runtimeverkeer. Als de Gateway niet bereikbaar is, valt de CLI terug op het offline lokale pad.
- Als de werkruimte van een andere agent hetzelfde pad is, binnen deze werkruimte ligt, of deze werkruimte bevat,
  wordt de werkruimte behouden en rapporteert `--json` `workspaceRetained`,
  `workspaceRetainedReason` en `workspaceSharedWith`.

## Identiteitsbestanden

Elke agentwerkruimte kan een `IDENTITY.md` bevatten in de hoofdmap van de werkruimte:

- Voorbeeldpad: `~/.openclaw/workspace/IDENTITY.md`
- `set-identity --from-identity` leest uit de hoofdmap van de werkruimte (of uit een expliciet `--identity-file`)

Avatarpaden worden relatief ten opzichte van de hoofdmap van de werkruimte opgelost.

## Identiteit instellen

`set-identity` schrijft velden naar `agents.list[].identity`:

- `name`
- `theme`
- `emoji`
- `avatar` (werkruimte-relatief pad, http(s)-URL of data-URI)

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
- Als je vertrouwt op `--workspace` en meerdere agents die werkruimte delen, mislukt de opdracht en wordt je gevraagd `--agent` door te geven.
- Lokale, werkruimte-relatieve avatarafbeeldingsbestanden zijn beperkt tot 2 MB. HTTP(S)-URL's en `data:`-URI's worden niet gecontroleerd met de lokale bestandsgroottelimiet.
- Wanneer er geen expliciete identiteitsvelden zijn opgegeven, leest de opdracht identiteitsgegevens uit `IDENTITY.md`.

Laden uit `IDENTITY.md`:

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
- [Routering met meerdere agents](/nl/concepts/multi-agent)
- [Agentwerkruimte](/nl/concepts/agent-workspace)
