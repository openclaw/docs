---
read_when:
    - Je wilt meerdere geïsoleerde agents (werkruimten + routering + authenticatie)
summary: CLI-referentie voor `openclaw agents` (weergeven/toevoegen/verwijderen/koppelingen/koppelen/ontkoppelen/identiteit instellen)
title: Agents
x-i18n:
    generated_at: "2026-07-12T08:39:59Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 89b6c59a9ce0fd0514343cc3fa66ae5e6d963cdfa5c6f58ffe6b9a6b5e943f09
    source_path: cli/agents.md
    workflow: 16
---

# `openclaw agents`

Beheer geïsoleerde agents (werkruimten + authenticatie + routering). Het uitvoeren van `openclaw agents` zonder subopdracht is gelijkwaardig aan `openclaw agents list`.

Gerelateerd:

- [Routering met meerdere agents](/nl/concepts/multi-agent)
- [Werkruimte van een agent](/nl/concepts/agent-workspace)
- [Skills-configuratie](/nl/tools/skills-config): configuratie van de zichtbaarheid van Skills.

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

## Opdrachtenoverzicht

### `agents list`

Opties: `--json`, `--bindings` (neem de volledige routeringsregels op, niet alleen aantallen/samenvattingen per agent).

### `agents add [name]`

Opties: `--workspace <dir>`, `--model <id>`, `--agent-dir <dir>`, `--bind <channel[:accountId]>` (herhaalbaar), `--non-interactive`, `--json`.

- Het doorgeven van een expliciete toevoegingsvlag schakelt de opdracht over naar het niet-interactieve pad.
- De niet-interactieve modus vereist zowel een agentnaam als `--workspace`.
- `main` is gereserveerd en kan niet als nieuwe agent-id worden gebruikt.
- De interactieve modus vult authenticatie vooraf door alleen overdraagbare statische referenties (`api_key` en profielen met een statisch `token`) te kopiëren, tenzij een referentie dit uitschakelt met `copyToAgents: false`; OAuth-profielen met vernieuwingstokens worden niet gekopieerd, tenzij een provider dit inschakelt met `copyToAgents: true`. Zonder kopie blijft OAuth alleen beschikbaar via doorleesovererving vanuit de echte opslag van de agent `main`. Als de geconfigureerde standaardagent niet `main` is, meldt u zich voor OAuth-profielen afzonderlijk aan bij de nieuwe agent.

### `agents bindings`

Opties: `--agent <id>`, `--json`.

### `agents bind`

Opties: `--agent <id>` (standaard de huidige standaardagent), `--bind <channel[:accountId]>` (herhaalbaar), `--json`.

### `agents unbind`

Opties: `--agent <id>` (standaard de huidige standaardagent), `--bind <channel[:accountId]>` (herhaalbaar), `--all`, `--json`. Accepteert `--all` of een of meer `--bind`-waarden, maar niet beide.

### `agents set-identity`

Opties: `--agent <id>`, `--workspace <dir>`, `--identity-file <path>`, `--from-identity`, `--name <name>`, `--theme <theme>`, `--emoji <emoji>`, `--avatar <value>`, `--json`. Zie [Identiteit instellen](#set-identity) hieronder.

### `agents delete <id>`

Opties: `--force`, `--json`.

- `main` kan niet worden verwijderd.
- Zonder `--force` is interactieve bevestiging vereist (dit mislukt in een niet-TTY-sessie; voer de opdracht opnieuw uit met `--force`).
- De werkruimte, agentstatus en mappen met sessietranscripten worden naar de prullenbak verplaatst en niet definitief verwijderd.
- Wanneer de Gateway bereikbaar is, verloopt de verwijdering via de Gateway, zodat het opschonen van de configuratie en sessieopslag dezelfde schrijver gebruikt als het runtimeverkeer. Als de Gateway onbereikbaar is, valt de CLI terug op het offline lokale pad.
- Als de werkruimte van een andere agent hetzelfde pad gebruikt, zich in deze werkruimte bevindt of deze werkruimte bevat, blijft de werkruimte behouden en rapporteert `--json` `workspaceRetained`, `workspaceRetainedReason` en `workspaceSharedWith`.

## Routeringskoppelingen

Gebruik routeringskoppelingen om inkomend kanaalverkeer aan een specifieke agent toe te wijzen.

Als u ook per agent verschillende zichtbare Skills wilt, configureert u `agents.defaults.skills` en `agents.list[].skills` in `openclaw.json`. Zie [Skills-configuratie](/nl/tools/skills-config) en [Configuratiereferentie](/nl/gateway/config-agents#agentsdefaultsskills).

Koppelingen weergeven:

```bash
openclaw agents bindings
openclaw agents bindings --agent work
openclaw agents bindings --json
```

Koppelingen toevoegen:

```bash
openclaw agents bind --agent work --bind telegram:ops --bind discord:guild-a
```

U kunt ook koppelingen toevoegen wanneer u een agent aanmaakt:

```bash
openclaw agents add work --workspace ~/.openclaw/workspace-work --bind telegram:* --bind discord:*
```

Als u `accountId` weglaat (`--bind <channel>`), bepaalt OpenClaw deze via installatiehooks van de plugin, een afgedwongen accountkoppeling of het aantal geconfigureerde accounts van het kanaal.

Als u `--agent` weglaat voor `bind` of `unbind`, gebruikt OpenClaw de huidige standaardagent als doel.

### Indeling van `--bind`

| Indeling                     | Betekenis                                                                                                             |
| ---------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| `--bind <channel>:*`         | Komt overeen met alle accounts op het kanaal.                                                                         |
| `--bind <channel>:<account>` | Komt overeen met één account.                                                                                         |
| `--bind <channel>`           | Komt alleen overeen met het standaardaccount, tenzij de CLI veilig een pluginspecifiek accountbereik kan vaststellen. |

### Gedrag van het koppelingsbereik

- Een opgeslagen koppeling zonder `accountId` komt alleen overeen met het standaardaccount van het kanaal.
- `accountId: "*"` is de kanaalbrede terugvaloptie (alle accounts) en is minder specifiek dan een expliciete accountkoppeling.
- Als dezelfde agent al een overeenkomende kanaalkoppeling zonder `accountId` heeft en u later een expliciete of vastgestelde `accountId` koppelt, werkt OpenClaw die bestaande koppeling ter plaatse bij in plaats van een duplicaat toe te voegen.

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

Na de upgrade is de routering voor die koppeling beperkt tot `telegram:alerts`. Als u ook routering voor het standaardaccount wilt, voegt u die expliciet toe (bijvoorbeeld `--bind telegram:default`).

Koppelingen verwijderen:

```bash
openclaw agents unbind --agent work --bind telegram:ops
openclaw agents unbind --agent work --all
```

## Identiteitsbestanden

Elke werkruimte van een agent kan een `IDENTITY.md` in de hoofdmap van de werkruimte bevatten:

- Voorbeeldpad: `~/.openclaw/workspace/IDENTITY.md`
- `set-identity --from-identity` leest uit de hoofdmap van de werkruimte (of uit een expliciet opgegeven `--identity-file`).

Avatarpaden worden relatief ten opzichte van de hoofdmap van de werkruimte bepaald en kunnen deze niet verlaten, zelfs niet via een symbolische koppeling.

## Identiteit instellen

`set-identity` schrijft velden naar `agents.list[].identity`: `name`, `theme`, `emoji`, `avatar` (een pad relatief aan de werkruimte, een http(s)-URL of een data-URI).

- Met `--agent` of `--workspace` selecteert u de doelagent. Als `--workspace` met meer dan één agent overeenkomt, mislukt de opdracht en wordt u gevraagd `--agent` door te geven.
- Lokale afbeeldingsbestanden voor avatars met een pad relatief aan de werkruimte zijn beperkt tot 2 MB. HTTP(S)-URL's en `data:`-URI's worden niet aan de lokale bestandsgroottelimiet getoetst.
- Wanneer geen expliciete identiteitsvelden zijn opgegeven, leest de opdracht identiteitsgegevens uit `IDENTITY.md`.

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
- [Werkruimte van een agent](/nl/concepts/agent-workspace)
