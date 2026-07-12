---
read_when:
    - Standaardinstellingen, toelatingslijsten of het gedrag van slash-opdrachten voor de verhoogde modus aanpassen
    - Begrijpen hoe geïsoleerde agents toegang kunnen krijgen tot de host
summary: 'Verhoogde uitvoeringsmodus: voer opdrachten buiten de sandbox uit vanuit een agent in een sandbox'
title: Verhoogde modus
x-i18n:
    generated_at: "2026-07-12T09:22:01Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ab035f2f0d0074da4e7661d9d690d89aa5eea25b7920ce48a2a03dffccded85b
    source_path: tools/elevated.md
    workflow: 16
---

Wanneer een agent binnen een sandbox wordt uitgevoerd, zijn diens `exec`-opdrachten beperkt tot de sandboxomgeving. In de **verhoogde modus** kan de agent daaruit ontsnappen en in plaats daarvan opdrachten buiten de sandbox uitvoeren, met configureerbare goedkeuringspoorten.

<Info>
  De verhoogde modus verandert het gedrag alleen wanneer de agent zich **in een sandbox** bevindt. Voor agents zonder sandbox wordt exec al op de host uitgevoerd.
</Info>

## Richtlijnen

Beheer de verhoogde modus per sessie met slash-opdrachten:

| Richtlijn        | Wat deze doet                                                                                                                                            |
| ---------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/elevated on`   | Buiten de sandbox uitvoeren op het geconfigureerde hostpad, met behoud van goedkeuringen                                                                  |
| `/elevated ask`  | Hetzelfde als `on` (alias)                                                                                                                               |
| `/elevated full` | Buiten de sandbox uitvoeren op het geconfigureerde hostpad en goedkeuringen overslaan wanneer het goedkeuringsbeleid voor modus/host al permissief is     |
| `/elevated off`  | Terugkeren naar uitvoering die tot de sandbox is beperkt                                                                                                 |

Ook beschikbaar als `/elev on|off|ask|full`.

Stuur `/elevated` zonder argument om het huidige niveau te bekijken.

## Werking

<Steps>
  <Step title="Beschikbaarheid controleren">
    Verhoogde uitvoering moet in de configuratie zijn ingeschakeld en de afzender moet op de toelatingslijst staan:

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
    Stuur een bericht dat alleen een richtlijn bevat om de standaardwaarde voor de sessie in te stellen:

    ```
    /elevated full
    ```

    Of gebruik deze inline (alleen van toepassing op dat bericht):

    ```
    /elevated on run the deployment script
    ```

  </Step>

  <Step title="Opdrachten worden buiten de sandbox uitgevoerd">
    Wanneer verhoogde uitvoering actief is, verlaten `exec`-aanroepen de sandbox. De effectieve host is
    standaard `gateway`, of `node` wanneer het geconfigureerde uitvoeringsdoel of dat van de sessie
    `node` is. In de modus `full` worden exec-goedkeuringen overgeslagen wanneer het bepaalde
    goedkeuringsbeleid voor uitvoeringsmodus/host al volledig permissief is (security `full`,
    ask `off`); anders blijft het normale goedkeuringsbeleid van toepassing. In de modus
    `on`/`ask` zijn de geconfigureerde goedkeuringsregels altijd van toepassing.
  </Step>
</Steps>

## Volgorde van bepaling

1. **Inline richtlijn** in het bericht (alleen van toepassing op dat bericht)
2. **Sessieoverschrijving** (ingesteld door een bericht te sturen dat alleen een richtlijn bevat)
3. **Globale standaardwaarde** (`agents.defaults.elevatedDefault` in de configuratie)

## Beschikbaarheid en toelatingslijsten

- **Globale poort**: `tools.elevated.enabled` (moet `true` zijn)
- **Toelatingslijst voor afzenders**: `tools.elevated.allowFrom` met lijsten per kanaal
- **Poort per agent**: `agents.list[].tools.elevated.enabled` (kan alleen verder beperken; zowel de globale poort als de poort per agent moet `true` zijn)
- **Toelatingslijst per agent**: `agents.list[].tools.elevated.allowFrom` (de afzender moet overeenkomen met zowel de globale lijst als die per agent)
- **Door het kanaal geleverde terugvaltoelatingslijst**: kanaalplugins kunnen optioneel via een SDK-adapterhook een terugvaltoelatingslijst leveren, die wordt gebruikt wanneer `tools.elevated.allowFrom.<provider>` niet is geconfigureerd. Momenteel implementeert geen enkel meegeleverd kanaal deze hook, dus in de praktijk heeft elke provider momenteel een expliciete vermelding voor `tools.elevated.allowFrom.<provider>` nodig.
- **Alle poorten moeten worden gepasseerd**; anders wordt verhoogde uitvoering als niet beschikbaar beschouwd

Notaties voor vermeldingen in de toelatingslijst:

| Voorvoegsel             | Komt overeen met                       |
| ----------------------- | -------------------------------------- |
| (geen)                  | Afzender-ID, E.164 of het From-veld    |
| `name:`                 | Weergavenaam van de afzender           |
| `username:`             | Gebruikersnaam van de afzender         |
| `tag:`                  | Tag van de afzender                    |
| `id:`, `from:`, `e164:` | Expliciete selectie van een identiteit |

## Wat verhoogde uitvoering niet beheert

- **Toolbeleid**: als `exec` door het toolbeleid wordt geweigerd, kan verhoogde uitvoering dit niet omzeilen.
- **Beleid voor hostselectie**: verhoogde uitvoering verandert `auto` niet in een vrije overschrijving tussen hosts. De regels voor het geconfigureerde uitvoeringsdoel of dat van de sessie worden gebruikt, waarbij `node` alleen wordt gekozen als het doel al `node` is.
- **Los van `/exec`**: de richtlijn `/exec` past de standaardwaarden voor exec per sessie aan (host, security, ask, node) voor bevoegde afzenders en vereist geen verhoogde modus.

<Note>
  De bash-chatopdracht (voorvoegsel `!`; alias `/bash`) heeft een afzonderlijke poort waarvoor `tools.elevated` moet zijn ingeschakeld, naast de eigen vlag `tools.bash.enabled`. Als verhoogde uitvoering wordt uitgeschakeld, worden ook `!`-shellopdrachten geblokkeerd.
</Note>

## Gerelateerd

<CardGroup cols={2}>
  <Card title="Exec-tool" href="/nl/tools/exec" icon="terminal">
    Uitvoering van shellopdrachten vanuit de agent.
  </Card>
  <Card title="Exec-goedkeuringen" href="/nl/tools/exec-approvals" icon="shield">
    Goedkeurings- en toelatingslijstsysteem voor `exec`.
  </Card>
  <Card title="Sandboxing" href="/nl/gateway/sandboxing" icon="box">
    Sandboxconfiguratie op Gateway-niveau.
  </Card>
  <Card title="Sandbox versus toolbeleid versus verhoogde uitvoering" href="/nl/gateway/sandbox-vs-tool-policy-vs-elevated" icon="scale-balanced">
    Hoe de drie poorten tijdens een toolaanroep samenwerken.
  </Card>
</CardGroup>
