---
read_when:
    - Je moet de agentwerkruimte of de bestandsindeling ervan uitleggen
    - Je wilt een back-up maken van een agentwerkruimte of deze migreren
sidebarTitle: Agent workspace
summary: 'Agentwerkruimte: locatie, indeling en back-upstrategie'
title: Agentwerkruimte
x-i18n:
    generated_at: "2026-04-29T22:36:45Z"
    model: gpt-5.5
    provider: openai
    source_hash: 35d59d1f0dec05db30f9166a43bfa519d7299b08d093bbeb905d8f83e5cd022a
    source_path: concepts/agent-workspace.md
    workflow: 16
---

De workspace is de thuisbasis van de agent. Het is de enige werkdirectory die wordt gebruikt voor bestandstools en voor workspace-context. Houd deze privé en behandel deze als geheugen.

Dit staat los van `~/.openclaw/`, waar configuratie, referenties en sessies worden opgeslagen.

<Warning>
De workspace is de **standaard cwd**, geen harde sandbox. Tools lossen relatieve paden op ten opzichte van de workspace, maar absolute paden kunnen nog steeds andere plekken op de host bereiken, tenzij sandboxing is ingeschakeld. Als je isolatie nodig hebt, gebruik dan [`agents.defaults.sandbox`](/nl/gateway/sandboxing) (en/of sandboxconfiguratie per agent).

Wanneer sandboxing is ingeschakeld en `workspaceAccess` niet `"rw"` is, werken tools binnen een sandbox-workspace onder `~/.openclaw/sandboxes`, niet in je host-workspace.
</Warning>

## Standaardlocatie

- Standaard: `~/.openclaw/workspace`
- Als `OPENCLAW_PROFILE` is ingesteld en niet `"default"` is, wordt de standaard `~/.openclaw/workspace-<profile>`.
- Overschrijven in `~/.openclaw/openclaw.json`:

```json5
{
  agents: {
    defaults: {
      workspace: "~/.openclaw/workspace",
    },
  },
}
```

`openclaw onboard`, `openclaw configure` of `openclaw setup` maakt de workspace aan en vult de bootstrapbestanden aan als ze ontbreken.

<Note>
Sandbox-seedkopieën accepteren alleen reguliere bestanden binnen de workspace; symlink-/hardlink-aliassen die buiten de bron-workspace uitkomen, worden genegeerd.
</Note>

Als je de workspace-bestanden al zelf beheert, kun je het aanmaken van bootstrapbestanden uitschakelen:

```json5
{ agents: { defaults: { skipBootstrap: true } } }
```

## Extra workspace-mappen

Oudere installaties kunnen `~/openclaw` hebben aangemaakt. Meerdere workspace-mappen bewaren kan verwarrende auth- of statusdrift veroorzaken, omdat er maar één workspace tegelijk actief is.

<Note>
**Aanbeveling:** houd één actieve workspace aan. Als je de extra mappen niet meer gebruikt, archiveer ze of verplaats ze naar de prullenmand (bijvoorbeeld `trash ~/openclaw`). Als je bewust meerdere workspaces aanhoudt, zorg er dan voor dat `agents.defaults.workspace` naar de actieve verwijst.

`openclaw doctor` waarschuwt wanneer extra workspace-mappen worden gedetecteerd.
</Note>

## Bestandskaart van de workspace

Dit zijn de standaardbestanden die OpenClaw binnen de workspace verwacht:

<AccordionGroup>
  <Accordion title="AGENTS.md — bedieningsinstructies">
    Bedieningsinstructies voor de agent en hoe deze geheugen moet gebruiken. Wordt aan het begin van elke sessie geladen. Goede plek voor regels, prioriteiten en details over "hoe te gedragen".
  </Accordion>
  <Accordion title="SOUL.md — persona en toon">
    Persona, toon en grenzen. Wordt elke sessie geladen. Gids: [SOUL.md-persoonlijkheidsgids](/nl/concepts/soul).
  </Accordion>
  <Accordion title="USER.md — wie de gebruiker is">
    Wie de gebruiker is en hoe deze moet worden aangesproken. Wordt elke sessie geladen.
  </Accordion>
  <Accordion title="IDENTITY.md — naam, sfeer, emoji">
    De naam, sfeer en emoji van de agent. Aangemaakt/bijgewerkt tijdens het bootstrapritueel.
  </Accordion>
  <Accordion title="TOOLS.md — lokale toolconventies">
    Notities over je lokale tools en conventies. Beheert de beschikbaarheid van tools niet; het is alleen richtlijn.
  </Accordion>
  <Accordion title="HEARTBEAT.md — Heartbeat-checklist">
    Optionele kleine checklist voor Heartbeat-runs. Houd deze kort om tokenverbruik te beperken.
  </Accordion>
  <Accordion title="BOOT.md — opstartchecklist">
    Optionele opstartchecklist die automatisch wordt uitgevoerd bij een Gateway-herstart (wanneer [interne hooks](/nl/automation/hooks) zijn ingeschakeld). Houd deze kort; gebruik de berichttool voor uitgaande berichten.
  </Accordion>
  <Accordion title="BOOTSTRAP.md — ritueel bij eerste uitvoering">
    Eenmalig ritueel bij eerste uitvoering. Wordt alleen aangemaakt voor een gloednieuwe workspace. Verwijder dit nadat het ritueel is voltooid.
  </Accordion>
  <Accordion title="memory/YYYY-MM-DD.md — dagelijks geheugenlogboek">
    Dagelijks geheugenlogboek (één bestand per dag). Aanbevolen om vandaag + gisteren te lezen bij sessiestart.
  </Accordion>
  <Accordion title="MEMORY.md — gecureerd langetermijngeheugen (optioneel)">
    Gecureerd langetermijngeheugen. Alleen laden in de hoofd-, privésessie (niet in gedeelde/groepscontexten). Zie [Geheugen](/nl/concepts/memory) voor de workflow en automatische geheugenflush.
  </Accordion>
  <Accordion title="skills/ — workspace-Skills (optioneel)">
    Workspace-specifieke Skills. Skill-locatie met de hoogste prioriteit voor die workspace. Overschrijft project-agent-Skills, persoonlijke agent-Skills, beheerde Skills, gebundelde Skills en `skills.load.extraDirs` wanneer namen botsen.
  </Accordion>
  <Accordion title="canvas/ — Canvas UI-bestanden (optioneel)">
    Canvas UI-bestanden voor nodeweergaven (bijvoorbeeld `canvas/index.html`).
  </Accordion>
</AccordionGroup>

<Note>
Als een bootstrapbestand ontbreekt, injecteert OpenClaw een markering voor "ontbrekend bestand" in de sessie en gaat door. Grote bootstrapbestanden worden afgekapt wanneer ze worden geïnjecteerd; pas limieten aan met `agents.defaults.bootstrapMaxChars` (standaard: 12000) en `agents.defaults.bootstrapTotalMaxChars` (standaard: 60000). `openclaw setup` kan ontbrekende standaardbestanden opnieuw aanmaken zonder bestaande bestanden te overschrijven.
</Note>

## Wat NIET in de workspace staat

Deze staan onder `~/.openclaw/` en mogen NIET worden gecommit naar de workspace-repo:

- `~/.openclaw/openclaw.json` (configuratie)
- `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` (model-authprofielen: OAuth + API-sleutels)
- `~/.openclaw/credentials/` (kanaal-/providerstatus plus verouderde OAuth-importgegevens)
- `~/.openclaw/agents/<agentId>/sessions/` (sessietranscripten + metadata)
- `~/.openclaw/skills/` (beheerde Skills)

Als je sessies of configuratie moet migreren, kopieer ze dan apart en houd ze buiten versiebeheer.

## Git-back-up (aanbevolen, privé)

Behandel de workspace als privégeheugen. Zet deze in een **privé** git-repo zodat er een back-up van is en herstel mogelijk is.

Voer deze stappen uit op de machine waarop de Gateway draait (daar bevindt de workspace zich).

<Steps>
  <Step title="Initialiseer de repo">
    Als git is geïnstalleerd, worden gloednieuwe workspaces automatisch geïnitialiseerd. Als deze workspace nog geen repo is, voer dan uit:

    ```bash
    cd ~/.openclaw/workspace
    git init
    git add AGENTS.md SOUL.md TOOLS.md IDENTITY.md USER.md HEARTBEAT.md memory/
    git commit -m "Add agent workspace"
    ```

  </Step>
  <Step title="Voeg een privé-remote toe">
    <Tabs>
      <Tab title="GitHub-web-UI">
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
      <Tab title="GitLab-web-UI">
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
  <Step title="Doorlopende updates">
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
Vermijd het opslaan van geheimen in de workspace, zelfs in een privé-repo:

- API-sleutels, OAuth-tokens, wachtwoorden of privéreferenties.
- Alles onder `~/.openclaw/`.
- Ruwe dumps van chats of gevoelige bijlagen.

Als je gevoelige verwijzingen moet opslaan, gebruik dan placeholders en bewaar het echte geheim elders (wachtwoordmanager, omgevingsvariabelen of `~/.openclaw/`).
</Warning>

Voorgestelde `.gitignore`-starter:

```gitignore
.DS_Store
.env
**/*.key
**/*.pem
**/secrets*
```

## De workspace naar een nieuwe machine verplaatsen

<Steps>
  <Step title="Clone de repo">
    Clone de repo naar het gewenste pad (standaard `~/.openclaw/workspace`).
  </Step>
  <Step title="Werk configuratie bij">
    Stel `agents.defaults.workspace` in op dat pad in `~/.openclaw/openclaw.json`.
  </Step>
  <Step title="Seed ontbrekende bestanden">
    Voer `openclaw setup --workspace <path>` uit om ontbrekende bestanden te seeden.
  </Step>
  <Step title="Kopieer sessies (optioneel)">
    Als je sessies nodig hebt, kopieer `~/.openclaw/agents/<agentId>/sessions/` apart vanaf de oude machine.
  </Step>
</Steps>

## Geavanceerde notities

- Multi-agent-routering kan verschillende workspaces per agent gebruiken. Zie [Kanaalroutering](/nl/channels/channel-routing) voor routeringsconfiguratie.
- Als `agents.defaults.sandbox` is ingeschakeld, kunnen niet-hoofdsessies sandbox-workspaces per sessie gebruiken onder `agents.defaults.sandbox.workspaceRoot`.

## Gerelateerd

- [Heartbeat](/nl/gateway/heartbeat) — HEARTBEAT.md-workspacebestand
- [Sandboxing](/nl/gateway/sandboxing) — workspace-toegang in sandboxed omgevingen
- [Sessie](/nl/concepts/session) — opslagpaden voor sessies
- [Vaste instructies](/nl/automation/standing-orders) — persistente instructies in workspace-bestanden
