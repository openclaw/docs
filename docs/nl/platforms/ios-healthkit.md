---
read_when:
    - HealthKit-samenvattingen inschakelen op een iPhone-node
    - health.summary aanroepen of problemen met ontbrekende statusgegevens oplossen
    - Controleren welke gezondheidsgegevens een iPhone kunnen verlaten
summary: Privacyafgeschermde HealthKit-samenvattingen inschakelen en aanroepen vanaf een iPhone-node
title: HealthKit-samenvattingen
x-i18n:
    generated_at: "2026-07-16T16:01:26Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 2f074c715ee1ef805ec953c301c03940e664c161f7f14c4388c83c64e222b557
    source_path: platforms/ios-healthkit.md
    workflow: 16
---

# HealthKit-samenvattingen

OpenClaw kan bij een verbonden iPhone-Node een alleen-lezen samenvatting van de huidige kalenderdag opvragen. De iPhone berekent het totaal op het apparaat en retourneert alleen het aantal stappen, de slaapduur, de gemiddelde hartslag in rust en het aantal/de duur van trainingen. Afzonderlijke HealthKit-metingen, bronnen, metadata, klinische dossiers, verwerking op de achtergrond en schrijfbewerkingen worden niet ondersteund.

Deze functie is standaard uitgeschakeld. Hiervoor zijn afzonderlijke toestemming op de iPhone en autorisatie op de Gateway vereist.

## Vereisten

- Een iPhone waarop de OpenClaw-app voor iOS wordt uitgevoerd en waarvoor HealthKit aangeeft dat gezondheidsgegevens beschikbaar zijn.
- Een verbonden en goedgekeurde iPhone-Node. Zie [Configuratie van de iOS-app](/nl/platforms/ios).
- Een actuele Gateway die de iPhone-Node kan bereiken.
- Leesbare Health-gegevens voor alle meetwaarden die je verwacht te zien. Een Apple Watch kan gegevens aan de Health-opslag op de iPhone toevoegen, maar de OpenClaw-app voor watchOS is niet vereist voor HealthKit-samenvattingen.

## Toegang inschakelen

### 1. Autoriseer de Gateway-opdracht

Voeg `health.summary` toe aan de bestaande `gateway.nodes.allowCommands`-array in `openclaw.json`. Behoud alle reeds aanwezige opdrachten:

```json5
{
  gateway: {
    nodes: {
      allowCommands: ["health.summary"],
    },
  },
}
```

`health.summary` is geclassificeerd als zeer privacygevoelig en wordt volgens de standaardinstellingen van het iOS-platform nooit toegestaan. Een vermelding in `gateway.nodes.denyCommands` heeft voorrang op de vermelding waarmee de opdracht wordt toegestaan. Zie [Opdrachtbeleid voor Nodes](/nl/nodes#command-policy).

### 2. Delen op de iPhone inschakelen

In de iOS-app:

1. Open **Settings -> Permissions -> Privacy & Access -> Health Summaries**.
2. Tik op **Enable & Share Summaries**.
3. Lees de toelichting en kies vervolgens in het toestemmingsvenster van Apple welke Health-categorieën OpenClaw mag lezen.

De schakelaar registreert je uitdrukkelijke keuze om gegevens met OpenClaw te delen. Dit betekent niet dat Apple toegang tot elke aangevraagde categorie heeft verleend.

Als je HealthKit-samenvattingen inschakelt, wordt `health.summary` toegevoegd aan het door de Node gedeclareerde opdrachtoppervlak. Keur de resulterende update van de Node-koppeling goed:

```bash
openclaw nodes pending
openclaw nodes approve <requestId>
```

Controleer vervolgens of de verbonden iPhone daadwerkelijk een `health.summary`-opdracht beschikbaar stelt:

```bash
openclaw nodes describe --node "<iPhone name>"
```

## De samenvatting van vandaag opvragen

Alleen `today` wordt ondersteund. Dit bestrijkt de periode vanaf lokale middernacht tot het tijdstip van de aanvraag, op basis van de huidige kalender en tijdzone van de iPhone.

```bash
openclaw nodes invoke \
  --node "<iPhone name>" \
  --command health.summary \
  --params '{"period":"today"}' \
  --json
```

Agents kunnen dezelfde opdracht aanroepen met de tool `nodes`:

```json
{
  "action": "invoke",
  "node": "<iPhone name>",
  "invokeCommand": "health.summary",
  "invokeParamsJson": "{\"period\":\"today\"}"
}
```

De samenvattingspayload bevat:

| Veld                     | Betekenis                                      |
| ------------------------ | ---------------------------------------------- |
| `period`                 | Altijd `today`                                 |
| `startISO`               | Lokaal begin van de dag, gecodeerd als een ISO-tijdstip |
| `endISO`                 | Tijdstip van de aanvraag, gecodeerd als een ISO-tijdstip |
| `timeZoneIdentifier`     | Tijdzone-identificatie van de iPhone           |
| `stepCount`              | Afgerond cumulatief aantal stappen             |
| `sleepDurationMinutes`   | Ontdubbelde slaaptijd, beperkt tot vandaag     |
| `restingHeartRateBpm`    | Gemiddelde hartslag in rust                    |
| `workoutCount`           | Trainingen die vandaag zijn begonnen           |
| `workoutDurationMinutes` | Totale duur van die trainingen                 |

Velden met meetwaarden zijn optioneel en worden weggelaten wanneer HealthKit geen leesbare waarde retourneert. Slaapfasen en overlappende bronnen worden samengevoegd voordat de duur wordt berekend, zodat dezelfde minuut niet tweemaal wordt geteld.

## Privacygedrag

- De aggregatie vindt plaats op de iPhone. Ruwe metingen verlaten het apparaat niet.
- Het opgevraagde totaal verlaat de iPhone via je Gateway. Wanneer een agent dit opvraagt, bereikt het totaal de geconfigureerde AI-provider en kan het in de chatgeschiedenis bewaard blijven. Bij een directe CLI-aanroep wordt het aan de CLI-operator geretourneerd.
- OpenClaw vraagt uitsluitend leestoegang aan. Het kan geen Health-gegevens toevoegen of wijzigen.
- OpenClaw leest HealthKit alleen wanneer `health.summary` wordt aangeroepen. Er vindt geen verwerking van gezondheidsgegevens op de achtergrond plaats.
- HealthKit maakt bewust niet bekend of leestoegang is geweigerd. Een ontbrekende meetwaarde kan wijzen op geweigerde toegang, het ontbreken van overeenkomende metingen of een niet-beschikbaar gegevenstype. OpenClaw kan deze gevallen niet van elkaar onderscheiden.
- De samenvatting is bedoeld als context voor persoonlijke gezondheid en conditie, niet voor diagnoses of medisch advies.

Ga terug naar **Health Summaries** en tik op **Disable** om het delen te stoppen. De iPhone verwijdert vervolgens de Health-mogelijkheid en de opdracht `health.summary` uit het Node-oppervlak. Je kunt ook `health.summary` uit `gateway.nodes.allowCommands` verwijderen om de toegang aan de Gateway-zijde af te sluiten.

## Problemen oplossen

### De opdracht wordt niet door de Node gedeclareerd

Controleer of HealthKit-samenvattingen in de iOS-app zijn ingeschakeld en of de iPhone verbonden is. Voer `openclaw nodes pending` uit, keur eventuele updates van mogelijkheden goed en controleer vervolgens `openclaw nodes describe --node "<iPhone name>"` opnieuw.

### De opdracht vereist uitdrukkelijke aanmelding

Voeg `health.summary` toe aan `gateway.nodes.allowCommands`. Controleer ook of `gateway.nodes.denyCommands` deze opdracht niet bevat; de lijst met geweigerde opdrachten heeft voorrang.

### `HEALTH_ACCESS_DISABLED`

De schakelaar voor delen in de app is uitgeschakeld. Schakel **Health Summaries** onder **Privacy & Access** op de iPhone in.

### De samenvatting slaagt, maar er ontbreken meetwaarden

Open de Health-app van Apple en controleer of er gegevens voor vandaag bestaan. Controleer de toegang van OpenClaw in de Health-instellingen van Apple, maar beschouw een leeg resultaat niet als bewijs dat toegang is geweigerd: HealthKit verbergt dit onderscheid bewust.

### Oudere perioden mislukken

De opdracht accepteert alleen `{"period":"today"}`. Samenvattingen van meerdere dagen en historische samenvattingen worden niet ondersteund.

## Gerelateerd

- [iOS-app](/nl/platforms/ios)
- [Nodes](/nl/nodes)
- [Naslaginformatie voor Gateway-configuratie](/nl/gateway/configuration-reference#gateway)
- [Beveiligingsaudit](/nl/gateway/security)
