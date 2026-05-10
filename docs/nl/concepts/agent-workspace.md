---
read_when:
    - Je moet de agentwerkruimte of de bestandsstructuur ervan uitleggen
    - Je wilt een back-up maken van een agentwerkruimte of deze migreren
sidebarTitle: Agent workspace
summary: 'Agentwerkruimte: locatie, indeling en back-upstrategie'
title: Agentwerkruimte
x-i18n:
    generated_at: "2026-05-10T19:31:05Z"
    model: gpt-5.5
    provider: openai
    source_hash: adb2ae19c702589010cc67907940ae21feb669cca262e36790a3059aa7d7744c
    source_path: concepts/agent-workspace.md
    workflow: 16
---

De werkruimte is de thuisbasis van de agent. Het is de enige werkdirectory die wordt gebruikt voor bestandstools en voor werkruimtecontext. Houd deze privé en behandel deze als geheugen.

Dit staat los van `~/.openclaw/`, waar configuratie, referenties en sessies worden opgeslagen.

<Warning>
De werkruimte is de **standaard-cwd**, geen harde sandbox. Tools lossen relatieve paden op ten opzichte van de werkruimte, maar absolute paden kunnen nog steeds elders op de host komen, tenzij sandboxing is ingeschakeld. Als je isolatie nodig hebt, gebruik dan [`agents.defaults.sandbox`](/nl/gateway/sandboxing) (en/of sandboxconfiguratie per agent).

Wanneer sandboxing is ingeschakeld en `workspaceAccess` niet `"rw"` is, werken tools binnen een sandboxwerkruimte onder `~/.openclaw/sandboxes`, niet in je hostwerkruimte.
</Warning>

## Standaardlocatie

- Standaard: `~/.openclaw/workspace`
- Als `OPENCLAW_PROFILE` is ingesteld en niet `"default"` is, wordt de standaard `~/.openclaw/workspace-<profile>`.
- Overschrijf in `~/.openclaw/openclaw.json`:

```json5
{
  agents: {
    defaults: {
      workspace: "~/.openclaw/workspace",
    },
  },
}
```

`openclaw onboard`, `openclaw configure` of `openclaw setup` maakt de werkruimte aan en vult de bootstrapbestanden aan als ze ontbreken.

<Note>
Sandbox-seedkopieën accepteren alleen gewone bestanden binnen de werkruimte; symlink-/hardlink-aliassen die buiten de bronwerkruimte uitkomen, worden genegeerd.
</Note>

Als je de werkruimtebestanden al zelf beheert, kun je het aanmaken van bootstrapbestanden uitschakelen:

```json5
{ agents: { defaults: { skipBootstrap: true } } }
```

## Extra werkruimtemappen

Oudere installaties hebben mogelijk `~/openclaw` aangemaakt. Meerdere werkruimtedirectories laten staan kan verwarrende auth- of statusdrift veroorzaken, omdat er maar één werkruimte tegelijk actief is.

<Note>
**Aanbeveling:** behoud één actieve werkruimte. Als je de extra mappen niet meer gebruikt, archiveer ze dan of verplaats ze naar de prullenmand (bijvoorbeeld `trash ~/openclaw`). Als je bewust meerdere werkruimten behoudt, zorg er dan voor dat `agents.defaults.workspace` naar de actieve verwijst.

`openclaw doctor` waarschuwt wanneer het extra werkruimtedirectories detecteert.
</Note>

## Bestandskaart van de werkruimte

Dit zijn de standaardbestanden die OpenClaw binnen de werkruimte verwacht:

<AccordionGroup>
  <Accordion title="AGENTS.md - operating instructions">
    Bedieningsinstructies voor de agent en hoe deze geheugen moet gebruiken. Geladen aan het begin van elke sessie. Goede plek voor regels, prioriteiten en details over "hoe je je moet gedragen".
  </Accordion>
  <Accordion title="SOUL.md - persona and tone">
    Persona, toon en grenzen. Wordt elke sessie geladen. Gids: [SOUL.md-persoonlijkheidsgids](/nl/concepts/soul).
  </Accordion>
  <Accordion title="USER.md - who the user is">
    Wie de gebruiker is en hoe deze moet worden aangesproken. Wordt elke sessie geladen.
  </Accordion>
  <Accordion title="IDENTITY.md - name, vibe, emoji">
    De naam, uitstraling en emoji van de agent. Aangemaakt/bijgewerkt tijdens het bootstrapritueel.
  </Accordion>
  <Accordion title="TOOLS.md - local tool conventions">
    Notities over je lokale tools en conventies. Regelt niet welke tools beschikbaar zijn; het is alleen richtlijn.
  </Accordion>
  <Accordion title="HEARTBEAT.md - heartbeat checklist">
    Optionele kleine checklist voor Heartbeat-runs. Houd deze kort om tokenverbruik te beperken.
  </Accordion>
  <Accordion title="BOOT.md - startup checklist">
    Optionele opstartchecklist die automatisch wordt uitgevoerd bij een Gateway-herstart (wanneer [interne hooks](/nl/automation/hooks) zijn ingeschakeld). Houd deze kort; gebruik de berichttool voor uitgaande verzendingen.
  </Accordion>
  <Accordion title="BOOTSTRAP.md - first-run ritual">
    Eenmalig ritueel voor de eerste run. Alleen aangemaakt voor een gloednieuwe werkruimte. Verwijder het nadat het ritueel is voltooid.
  </Accordion>
  <Accordion title="memory/YYYY-MM-DD.md - daily memory log">
    Dagelijks geheugenlogboek (één bestand per dag). Aanbevolen om vandaag + gisteren te lezen bij het starten van de sessie.
  </Accordion>
  <Accordion title="MEMORY.md - curated long-term memory (optional)">
    Gecureerd langetermijngeheugen: duurzame feiten, voorkeuren, beslissingen en korte samenvattingen. Bewaar gedetailleerde logs in `memory/YYYY-MM-DD.md`, zodat geheugentools ze op aanvraag kunnen ophalen zonder ze in elke prompt te injecteren. Laad `MEMORY.md` alleen in de hoofd-, privésessie (niet in gedeelde/groepscontexten). Zie [Geheugen](/nl/concepts/memory) voor de workflow en automatische geheugenflush.
  </Accordion>
  <Accordion title="skills/ - workspace skills (optional)">
    Werkruimtespecifieke Skills. Skill-locatie met de hoogste prioriteit voor die werkruimte. Overschrijft projectagentskills, persoonlijke agentskills, beheerde skills, gebundelde skills en `skills.load.extraDirs` wanneer namen botsen.
  </Accordion>
  <Accordion title="canvas/ - Canvas UI files (optional)">
    Canvas-UI-bestanden voor nodeweergaven (bijvoorbeeld `canvas/index.html`).
  </Accordion>
</AccordionGroup>

<Note>
Als een bootstrapbestand ontbreekt, injecteert OpenClaw een markering "ontbrekend bestand" in de sessie en gaat het door. Grote bootstrapbestanden worden afgekapt wanneer ze worden geïnjecteerd; pas limieten aan met `agents.defaults.bootstrapMaxChars` (standaard: 12000) en `agents.defaults.bootstrapTotalMaxChars` (standaard: 60000). `openclaw setup` kan ontbrekende standaardbestanden opnieuw aanmaken zonder bestaande bestanden te overschrijven.
</Note>

## Wat NIET in de werkruimte staat

Deze staan onder `~/.openclaw/` en mogen NIET worden gecommit naar de werkruimterepo:

- `~/.openclaw/openclaw.json` (configuratie)
- `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` (modelauthprofielen: OAuth + API-sleutels)
- `~/.openclaw/agents/<agentId>/agent/codex-home/` (Codex-runtimeaccount, configuratie, skills, plugins en native threadstatus per agent)
- `~/.openclaw/credentials/` (kanaal-/providerstatus plus verouderde OAuth-importgegevens)
- `~/.openclaw/agents/<agentId>/sessions/` (sessietranscripten + metadata)
- `~/.openclaw/skills/` (beheerde skills)

Als je sessies of configuratie moet migreren, kopieer ze dan afzonderlijk en houd ze buiten versiebeheer.

## Git-back-up (aanbevolen, privé)

Behandel de werkruimte als privégeheugen. Zet deze in een **privé** git-repo zodat er een back-up is en herstel mogelijk is.

Voer deze stappen uit op de machine waarop de Gateway draait (daar bevindt de werkruimte zich).

<Steps>
  <Step title="Initialize the repo">
    Als git is geïnstalleerd, worden gloednieuwe werkruimten automatisch geïnitialiseerd. Als deze werkruimte nog geen repo is, voer dan uit:

    ```bash
    cd ~/.openclaw/workspace
    git init
    git add AGENTS.md SOUL.md TOOLS.md IDENTITY.md USER.md HEARTBEAT.md memory/
    git commit -m "Add agent workspace"
    ```

  </Step>
  <Step title="Add a private remote">
    <Tabs>
      <Tab title="GitHub web UI">
        1. Maak een nieuwe **privé** repository aan op GitHub.
        2. Initialiseer niet met een README (voorkomt mergeconflicten).
        3. Kopieer de HTTPS-remote-URL.
        4. Voeg de remote toe en push:

        ```bash
        git branch -M main
        git remote add origin <https-url>
        git push -u origin main
        ```
      </Tab>
      <Tab title="GitHub CLI (gh)">
        ```bash
        gh auth login
        gh repo create openclaw-workspace --private --source . --remote origin --push
        ```
      </Tab>
      <Tab title="GitLab web UI">
        1. Maak een nieuwe **privé** repository aan op GitLab.
        2. Initialiseer niet met een README (voorkomt mergeconflicten).
        3. Kopieer de HTTPS-remote-URL.
        4. Voeg de remote toe en push:

        ```bash
        git branch -M main
        git remote add origin <https-url>
        git push -u origin main
        ```
      </Tab>
    </Tabs>

  </Step>
  <Step title="Ongoing updates">
    ```bash
    git status
    git add .
    git commit -m "Update memory"
    git push
    ```
  </Step>
</Steps>

## Commit geen geheimen

<Warning>
Vermijd, zelfs in een privérepo, het opslaan van geheimen in de werkruimte:

- API-sleutels, OAuth-tokens, wachtwoorden of privéreferenties.
- Alles onder `~/.openclaw/`.
- Ruwe dumps van chats of gevoelige bijlagen.

Als je gevoelige verwijzingen moet opslaan, gebruik dan placeholders en bewaar het echte geheim elders (wachtwoordbeheerder, omgevingsvariabelen of `~/.openclaw/`).
</Warning>

Voorgestelde `.gitignore`-starter:

```gitignore
.DS_Store
.env
**/*.key
**/*.pem
**/secrets*
```

## De werkruimte naar een nieuwe machine verplaatsen

<Steps>
  <Step title="Clone the repo">
    Clone de repo naar het gewenste pad (standaard `~/.openclaw/workspace`).
  </Step>
  <Step title="Update config">
    Stel `agents.defaults.workspace` in op dat pad in `~/.openclaw/openclaw.json`.
  </Step>
  <Step title="Seed missing files">
    Voer `openclaw setup --workspace <path>` uit om ontbrekende bestanden te seeden.
  </Step>
  <Step title="Copy sessions (optional)">
    Als je sessies nodig hebt, kopieer dan `~/.openclaw/agents/<agentId>/sessions/` afzonderlijk vanaf de oude machine.
  </Step>
</Steps>

## Geavanceerde opmerkingen

- Multi-agentrouting kan verschillende werkruimten per agent gebruiken. Zie [Kanaalrouting](/nl/channels/channel-routing) voor routingconfiguratie.
- Als `agents.defaults.sandbox` is ingeschakeld, kunnen niet-hoofdsessies sandboxwerkruimten per sessie gebruiken onder `agents.defaults.sandbox.workspaceRoot`.

## Gerelateerd

- [Heartbeat](/nl/gateway/heartbeat) - HEARTBEAT.md-werkruimtebestand
- [Sandboxing](/nl/gateway/sandboxing) - werkruimtetoegang in sandboxomgevingen
- [Sessie](/nl/concepts/session) - opslagpaden voor sessies
- [Vaste instructies](/nl/automation/standing-orders) - persistente instructies in werkruimtebestanden
