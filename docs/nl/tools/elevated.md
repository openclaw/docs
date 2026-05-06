---
read_when:
    - Standaardinstellingen voor verhoogde modus, toelatingslijsten of gedrag van slash-opdrachten aanpassen
    - Begrijpen hoe agents in een sandbox toegang kunnen krijgen tot de host
summary: 'Verhoogde exec-modus: voer opdrachten buiten de sandbox uit vanuit een agent in een sandbox'
title: Modus met verhoogde rechten
x-i18n:
    generated_at: "2026-05-06T09:35:16Z"
    model: gpt-5.5
    provider: openai
    source_hash: 91aab7c105643d8e5d07d89cd5ab176f0a40cd3d23e2b20b3986cbf76f575d64
    source_path: tools/elevated.md
    workflow: 16
---

Wanneer een agent binnen een sandbox draait, zijn de `exec`-opdrachten beperkt tot de
sandboxomgeving. **Verhoogde modus** laat de agent daaruit breken en in plaats daarvan opdrachten
buiten de sandbox uitvoeren, met configureerbare goedkeuringspoorten.

<Info>
  Verhoogde modus verandert alleen gedrag wanneer de agent **gesandboxt** is. Voor
  niet-gesandboxte agents draait exec al op de host.
</Info>

## Richtlijnen

Beheer verhoogde modus per sessie met slash-opdrachten:

| Richtlijn        | Wat deze doet                                                         |
| ---------------- | -------------------------------------------------------------------- |
| `/elevated on`   | Buiten de sandbox uitvoeren op het geconfigureerde hostpad, goedkeuringen behouden |
| `/elevated ask`  | Hetzelfde als `on` (alias)                                           |
| `/elevated full` | Buiten de sandbox uitvoeren op het geconfigureerde hostpad en goedkeuringen overslaan |
| `/elevated off`  | Terugkeren naar uitvoering die tot de sandbox beperkt is             |

Ook beschikbaar als `/elev on|off|ask|full`.

Stuur `/elevated` zonder argument om het huidige niveau te zien.

## Hoe het werkt

<Steps>
  <Step title="Beschikbaarheid controleren">
    Verhoogd moet in de configuratie zijn ingeschakeld en de afzender moet op de toegestane lijst staan:

    ```json5
    {
      tools: {
        elevated: {
          enabled: true,
          allowFrom: {
            discord: ["user-id-123"],
            whatsapp: ["+15555550123"],
          },
        },
      },
    }
    ```

  </Step>

  <Step title="Het niveau instellen">
    Stuur een bericht dat alleen uit een richtlijn bestaat om de sessiestandaard in te stellen:

    ```
    /elevated full
    ```

    Of gebruik het inline (geldt alleen voor dat bericht):

    ```
    /elevated on run the deployment script
    ```

  </Step>

  <Step title="Opdrachten worden buiten de sandbox uitgevoerd">
    Met verhoogd actief verlaten `exec`-aanroepen de sandbox. De effectieve host is
    standaard `gateway`, of `node` wanneer het geconfigureerde exec-doel of sessie-exec-doel
    `node` is. In `full`-modus worden exec-goedkeuringen overgeslagen. In `on`/`ask`-modus
    blijven geconfigureerde goedkeuringsregels gelden.
  </Step>
</Steps>

## Volgorde van oplossing

1. **Inline richtlijn** in het bericht (geldt alleen voor dat bericht)
2. **Sessie-overschrijving** (ingesteld door een bericht te sturen dat alleen uit een richtlijn bestaat)
3. **Globale standaard** (`agents.defaults.elevatedDefault` in de configuratie)

## Beschikbaarheid en toegestane lijsten

- **Globale poort**: `tools.elevated.enabled` (moet `true` zijn)
- **Toegestane lijst voor afzenders**: `tools.elevated.allowFrom` met lijsten per kanaal
- **Poort per agent**: `agents.list[].tools.elevated.enabled` (kan alleen verder beperken)
- **Toegestane lijst per agent**: `agents.list[].tools.elevated.allowFrom` (afzender moet zowel globaal als per agent overeenkomen)
- **Discord-terugval**: als `tools.elevated.allowFrom.discord` is weggelaten, wordt `channels.discord.allowFrom` als terugval gebruikt
- **Alle poorten moeten slagen**; anders wordt verhoogd als niet beschikbaar behandeld

Indelingen voor vermeldingen in de toegestane lijst:

| Voorvoegsel             | Komt overeen met               |
| ----------------------- | ------------------------------ |
| (geen)                  | Afzender-ID, E.164 of From-veld |
| `name:`                 | Weergavenaam van afzender      |
| `username:`             | Gebruikersnaam van afzender    |
| `tag:`                  | Tag van afzender               |
| `id:`, `from:`, `e164:` | Expliciete identiteitstargeting |

## Wat verhoogd niet beheert

- **Toolbeleid**: als `exec` door toolbeleid wordt geweigerd, kan verhoogd dat niet overschrijven.
- **Hostselectiebeleid**: verhoogd verandert `auto` niet in een vrije cross-host-overschrijving. Het gebruikt de geconfigureerde regels of sessieregels voor het exec-doel en kiest alleen `node` wanneer het doel al `node` is.
- **Los van `/exec`**: de `/exec`-richtlijn past exec-standaarden per sessie aan voor geautoriseerde afzenders en vereist geen verhoogde modus.

<Note>
  De bash-chatopdracht (`!`-voorvoegsel; `/bash`-alias) is een aparte poort waarvoor `tools.elevated` moet zijn ingeschakeld naast de eigen vlag `tools.bash.enabled`. Als verhoogd wordt uitgeschakeld, worden `!`-shellopdrachten ook geblokkeerd.
</Note>

## Gerelateerd

<CardGroup cols={2}>
  <Card title="Exec-tool" href="/nl/tools/exec" icon="terminal">
    Uitvoering van shellopdrachten vanuit de agent.
  </Card>
  <Card title="Exec-goedkeuringen" href="/nl/tools/exec-approvals" icon="shield">
    Systeem voor goedkeuringen en toegestane lijsten voor `exec`.
  </Card>
  <Card title="Sandboxing" href="/nl/gateway/sandboxing" icon="box">
    Sandboxconfiguratie op Gateway-niveau.
  </Card>
  <Card title="Sandbox versus toolbeleid versus verhoogd" href="/nl/gateway/sandbox-vs-tool-policy-vs-elevated" icon="scale-balanced">
    Hoe de drie poorten samenwerken tijdens een toolaanroep.
  </Card>
</CardGroup>
