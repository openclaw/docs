---
read_when:
    - Standaardinstellingen voor verhoogde modus, allowlists of gedrag van slash-commando's aanpassen
    - Begrijpen hoe agents in een sandbox toegang kunnen krijgen tot de host
summary: 'Verhoogde uitvoeringsmodus: voer opdrachten uit buiten de sandbox vanuit een gesandboxte agent'
title: Modus met verhoogde rechten
x-i18n:
    generated_at: "2026-04-29T23:22:43Z"
    model: gpt-5.5
    provider: openai
    source_hash: 5b91b4af36f9485695f2afebe9bf8d7274d7aad6d0d88e762e581b0d091e04f7
    source_path: tools/elevated.md
    workflow: 16
---

Wanneer een agent binnen een sandbox draait, zijn de `exec`-commando's beperkt tot de
sandbox-omgeving. **Verhoogde modus** laat de agent uitbreken en in plaats daarvan
commando's buiten de sandbox uitvoeren, met configureerbare goedkeuringspoorten.

<Info>
  Verhoogde modus wijzigt alleen gedrag wanneer de agent **gesandboxed** is. Voor
  agents zonder sandbox draait exec al op de host.
</Info>

## Richtlijnen

Beheer verhoogde modus per sessie met slash-commando's:

| Richtlijn        | Wat deze doet                                                         |
| ---------------- | --------------------------------------------------------------------- |
| `/elevated on`   | Voer uit buiten de sandbox op het geconfigureerde hostpad, behoud goedkeuringen |
| `/elevated ask`  | Hetzelfde als `on` (alias)                                            |
| `/elevated full` | Voer uit buiten de sandbox op het geconfigureerde hostpad en sla goedkeuringen over |
| `/elevated off`  | Keer terug naar uitvoering beperkt tot de sandbox                     |

Ook beschikbaar als `/elev on|off|ask|full`.

Stuur `/elevated` zonder argument om het huidige niveau te zien.

## Hoe het werkt

<Steps>
  <Step title="Beschikbaarheid controleren">
    Elevated moet zijn ingeschakeld in de configuratie en de afzender moet op de allowlist staan:

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
    Stuur een bericht dat alleen een richtlijn bevat om de sessiestandaard in te stellen:

    ```
    /elevated full
    ```

    Of gebruik het inline (geldt alleen voor dat bericht):

    ```
    /elevated on run the deployment script
    ```

  </Step>

  <Step title="Commando's draaien buiten de sandbox">
    Met elevated actief verlaten `exec`-aanroepen de sandbox. De effectieve host is
    standaard `gateway`, of `node` wanneer het geconfigureerde/sessie-exec-doel
    `node` is. In `full`-modus worden exec-goedkeuringen overgeslagen. In `on`/`ask`-modus
    blijven geconfigureerde goedkeuringsregels van toepassing.
  </Step>
</Steps>

## Resolutievolgorde

1. **Inline-richtlijn** in het bericht (geldt alleen voor dat bericht)
2. **Sessie-override** (ingesteld door een bericht te sturen dat alleen een richtlijn bevat)
3. **Globale standaard** (`agents.defaults.elevatedDefault` in configuratie)

## Beschikbaarheid en allowlists

- **Globale poort**: `tools.elevated.enabled` (moet `true` zijn)
- **Allowlist voor afzenders**: `tools.elevated.allowFrom` met lijsten per kanaal
- **Poort per agent**: `agents.list[].tools.elevated.enabled` (kan alleen verder beperken)
- **Allowlist per agent**: `agents.list[].tools.elevated.allowFrom` (afzender moet overeenkomen met zowel globaal als per agent)
- **Discord-fallback**: als `tools.elevated.allowFrom.discord` is weggelaten, wordt `channels.discord.allowFrom` als fallback gebruikt
- **Alle poorten moeten slagen**; anders wordt elevated als niet beschikbaar behandeld

Allowlist-invoerformaten:

| Voorvoegsel             | Komt overeen met               |
| ----------------------- | ------------------------------ |
| (geen)                  | Afzender-ID, E.164 of From-veld |
| `name:`                 | Weergavenaam van afzender      |
| `username:`             | Gebruikersnaam van afzender    |
| `tag:`                  | Tag van afzender               |
| `id:`, `from:`, `e164:` | Expliciete identiteitstargeting |

## Wat elevated niet beheert

- **Toolbeleid**: als `exec` wordt geweigerd door toolbeleid, kan elevated dit niet omzeilen
- **Hostselectiebeleid**: elevated verandert `auto` niet in een vrije cross-host-override. Het gebruikt de geconfigureerde/sessie-exec-doelregels en kiest `node` alleen wanneer het doel al `node` is.
- **Los van `/exec`**: de `/exec`-richtlijn past exec-standaarden per sessie aan voor geautoriseerde afzenders en vereist geen verhoogde modus

## Gerelateerd

- [Exec-tool](/nl/tools/exec) — uitvoering van shell-commando's
- [Exec-goedkeuringen](/nl/tools/exec-approvals) — goedkeurings- en allowlist-systeem
- [Sandboxing](/nl/gateway/sandboxing) — sandboxconfiguratie
- [Sandbox versus toolbeleid versus elevated](/nl/gateway/sandbox-vs-tool-policy-vs-elevated)
