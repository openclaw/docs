---
read_when:
    - Je wilt agenthooks beheren
    - U wilt de beschikbaarheid van hooks controleren of werkruimtehooks inschakelen
summary: CLI-referentie voor `openclaw hooks` (agenthooks)
title: Hooks
x-i18n:
    generated_at: "2026-07-12T08:43:16Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f33d1e343771971bdc17dcafdabc6c4fc893b3080897862475a148e5f3957796
    source_path: cli/hooks.md
    workflow: 16
---

# `openclaw hooks`

Beheer agenthooks (gebeurtenisgestuurde automatiseringen voor opdrachten zoals `/new`, `/reset` en het starten van de Gateway). Alleen `openclaw hooks` is gelijkwaardig aan `openclaw hooks list`.

Gerelateerd: [Hooks](/nl/automation/hooks) - [Pluginhooks](/nl/plugins/hooks)

## Hooks weergeven

```bash
openclaw hooks list [--eligible] [--json] [-v|--verbose]
```

Geeft hooks weer die zijn gevonden in werkruimte-, beheerde, extra en meegeleverde mappen.

- `--eligible`: alleen hooks waarvan aan de vereisten is voldaan.
- `--json`: gestructureerde uitvoer.
- `-v, --verbose`: neem een kolom Missing op met vereisten waaraan niet is voldaan.

```
Hooks (4/5 gereed)

Gereed:
  🚀 boot-md ✓ - Voer BOOT.md uit wanneer de Gateway start
  📎 bootstrap-extra-files ✓ - Voeg aanvullende bootstrapbestanden voor de werkruimte in tijdens de bootstrap van de agent
  📝 command-logger ✓ - Registreer alle opdrachtgebeurtenissen in een centraal auditbestand
  💾 session-memory ✓ - Sla de sessiecontext op in het geheugen wanneer de opdracht /new of /reset wordt uitgevoerd
```

## Hookinformatie ophalen

```bash
openclaw hooks info <name> [--json]
```

`<name>` is de hooknaam of hooksleutel (bijvoorbeeld `session-memory`). Toont de bron, paden van bestanden/handlers, homepage, gebeurtenissen en de status per vereiste (binaire bestanden, omgeving, configuratie, besturingssysteem).

## Geschiktheid controleren

```bash
openclaw hooks check [--json]
```

Toont een samenvatting met aantallen gereed/niet gereed; als hooks niet gereed zijn, worden ze elk met de blokkerende reden weergegeven.

## Een hook inschakelen

```bash
openclaw hooks enable <name>
```

Voegt `hooks.internal.entries.<name>.enabled = true` toe aan de configuratie of werkt dit bij en schakelt ook de hoofdschakelaar `hooks.internal.enabled` in (de Gateway laadt geen interne hookhandler totdat er ten minste één is geconfigureerd). Mislukt als de hook niet bestaat, door een Plugin wordt beheerd of niet geschikt is (ontbrekende vereisten).

Door Plugins beheerde hooks tonen `plugin:<id>` in `hooks list` en kunnen hier niet worden in- of uitgeschakeld; schakel in plaats daarvan de beherende Plugin in of uit.

Start de Gateway opnieuw na het inschakelen (start de macOS-menubalkapp opnieuw of start tijdens ontwikkeling uw Gateway-proces opnieuw), zodat de hooks opnieuw worden geladen.

## Een hook uitschakelen

```bash
openclaw hooks disable <name>
```

Stelt `hooks.internal.entries.<name>.enabled = false` in. Start de Gateway daarna opnieuw.

## Hookpakketten installeren en bijwerken

```bash
openclaw plugins install <package>        # standaard npm
openclaw plugins install npm:<package>    # alleen npm
openclaw plugins install <package> --pin  # opgeloste versie vastzetten
openclaw plugins install <path>           # lokale map of lokaal archief
openclaw plugins install -l <path>        # een lokale map koppelen in plaats van kopiëren

openclaw plugins update <id>
openclaw plugins update --all
openclaw plugins update --dry-run
```

Hookpakketten worden geïnstalleerd via het uniforme installatie- en bijwerkprogramma voor Plugins; `openclaw hooks install` / `openclaw hooks update` werken nog als verouderde aliassen die een waarschuwing tonen en doorsturen naar de `plugins`-opdrachten.

- Npm-specificaties zijn uitsluitend voor het register: een pakketnaam plus een optionele exacte versie of dist-tag. Git-/URL-/bestandsspecificaties en semver-bereiken worden geweigerd. Afhankelijkheden worden projectlokaal geïnstalleerd met `--ignore-scripts`.
- Kale specificaties en `@latest` blijven op het stabiele kanaal; als npm een voorlopige versie oplevert, stopt OpenClaw en wordt u gevraagd expliciet toestemming te geven (`@beta`, `@rc` of een exacte voorlopige versie).
- Ondersteunde archieven: `.zip`, `.tgz`, `.tar.gz`, `.tar`.
- `-l, --link` koppelt een lokale map in plaats van deze te kopiëren (voegt deze toe aan `hooks.internal.load.extraDirs`); gekoppelde hookpakketten zijn beheerde hooks uit een door een beheerder geconfigureerde map, geen werkruimtehooks.
- `--pin` registreert npm-installaties als een exact opgeloste `name@version` in `hooks.internal.installs`.
- De installatie kopieert het pakket naar `~/.openclaw/hooks/<id>`, schakelt de bijbehorende hooks in onder `hooks.internal.entries.*` en registreert de installatie onder `hooks.internal.installs`.
- Als een opgeslagen integriteitshash niet meer overeenkomt met het opgehaalde artefact, waarschuwt OpenClaw en vraagt het om bevestiging voordat het doorgaat; geef de globale optie `--yes` door om de vraag over te slaan (bijvoorbeeld in CI).

## Meegeleverde hooks

| Hook                  | Gebeurtenissen                                    | Wat deze doet                                                                                              |
| --------------------- | ------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| boot-md               | `gateway:startup`                                 | Voert `BOOT.md` uit bij het starten van de Gateway voor elk geconfigureerd agentbereik                     |
| bootstrap-extra-files | `agent:bootstrap`                                 | Voegt extra bootstrapbestanden toe (bijvoorbeeld `AGENTS.md`/`TOOLS.md` uit een monorepo) tijdens de bootstrap van de agent |
| command-logger        | `command`                                         | Registreert opdrachtgebeurtenissen in `~/.openclaw/logs/commands.log`                                      |
| compaction-notifier   | `session:compact:before`, `session:compact:after` | Stuurt zichtbare chatmeldingen wanneer sessiecompactie begint en eindigt                                  |
| session-memory        | `command:new`, `command:reset`                    | Slaat de sessiecontext op in het geheugen bij `/new` of `/reset`                                           |

Schakel een meegeleverde hook in met `openclaw hooks enable <hook-name>`. Volledige details, configuratiesleutels en standaardwaarden: [Meegeleverde hooks](/nl/automation/hooks#bundled-hooks).

### Logbestand van command-logger

```bash
tail -n 20 ~/.openclaw/logs/commands.log        # recente opdrachten
cat ~/.openclaw/logs/commands.log | jq .          # leesbaar opmaken
grep '"action":"new"' ~/.openclaw/logs/commands.log | jq .   # filteren op actie
```

## Opmerkingen

- `hooks list --json`, `info --json` en `check --json` schrijven gestructureerde JSON rechtstreeks naar stdout.

## Gerelateerd

- [CLI-referentie](/nl/cli)
- [Automatiseringshooks](/nl/automation/hooks)
