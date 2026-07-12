---
read_when:
    - OpenClaw verbinden met een ClickClack-werkruimte
    - ClickClack-botidentiteiten testen
summary: ClickClack-kanaalconfiguratie met bottoken en doelsyntaxis
title: ClickClack
x-i18n:
    generated_at: "2026-07-12T08:35:16Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a1fee023fd87a7b00333c18a24edfb028b231540724ba6092cf7d2b663643641
    source_path: channels/clickclack.md
    workflow: 16
---

ClickClack verbindt OpenClaw met een zelfgehoste ClickClack-werkruimte via volwaardige ClickClack-bottokens.

Gebruik dit wanneer je een OpenClaw-agent als ClickClack-botgebruiker wilt laten optreden. ClickClack ondersteunt onafhankelijke servicebots en bots die eigendom zijn van gebruikers; bots die eigendom zijn van gebruikers behouden een `owner_user_id` en krijgen alleen de tokenbereiken die je verleent.

## Snelle configuratie

Maak een bottoken aan op de ClickClack-server:

```bash
clickclack admin bot create \
  --workspace <workspace_id> \
  --name "OpenClaw" \
  --handle openclaw \
  --scopes bot:write \
  --plain
```

Voeg voor een bot die eigendom is van een gebruiker `--owner <user_id>` toe.

Configureer OpenClaw:

```json5
{
  channels: {
    clickclack: {
      enabled: true,
      baseUrl: "https://clickclack.example.com",
      token: { source: "env", provider: "default", id: "CLICKCLACK_BOT_TOKEN" },
      workspace: "default",
      defaultTo: "channel:general",
    },
  },
}
```

Voer daarna het volgende uit:

```bash
export CLICKCLACK_BOT_TOKEN="ccb_..."
openclaw gateway
```

Een account geldt alleen als geconfigureerd wanneer `baseUrl`, `token` en `workspace` allemaal zijn ingesteld. `workspace` accepteert een werkruimte-id (`wsp_...`), slug of naam; de Gateway zet deze bij het opstarten om naar de id.

### Configuratiesleutels voor accounts

| Sleutel                 | Standaardwaarde      | Opmerkingen                                                                                         |
| ----------------------- | -------------------- | --------------------------------------------------------------------------------------------------- |
| `baseUrl`               | geen (vereist)       | URL van de ClickClack-server.                                                                       |
| `token`                 | geen (vereist)       | Platte tekenreeks of geheimverwijzing (`source: "env" \| "file" \| "exec"`).                        |
| `workspace`             | geen (vereist)       | Werkruimte-id, slug of naam.                                                                        |
| `replyMode`             | `"agent"`            | `"agent"` voert de volledige agentpijplijn uit; `"model"` verzendt korte, directe modelvoltooiingen. |
| `defaultTo`             | `"channel:general"`  | Doel dat wordt gebruikt wanneer een uitgaand pad geen doel opgeeft.                                 |
| `allowFrom`             | `["*"]`              | Toegestane lijst met gebruikers-id's voor inkomende privéberichten en kanaalberichten.              |
| `botUserId`             | automatisch gedetecteerd | Bij het opstarten afgeleid van de identiteit van het bottoken.                                  |
| `agentId`               | standaardroute       | Koppel de inkomende berichten van dit account aan één agent.                                        |
| `toolsAllow`            | geen                 | Toegestane lijst met hulpmiddelen voor agentantwoorden vanaf dit account.                            |
| `model`, `systemPrompt` | geen                 | Gebruikt voor voltooiingen met `replyMode: "model"`.                                                 |
| `reconnectMs`           | `1500`               | Vertraging voor opnieuw verbinden in realtime (100 tot 60000).                                      |

Als `plugins.allow` een niet-lege beperkende lijst is, wordt bij het expliciet
selecteren van ClickClack tijdens de kanaalconfiguratie of bij het uitvoeren van
`openclaw plugins enable clickclack` de waarde `clickclack` aan die lijst
toegevoegd. Installatie tijdens de introductie gebruikt hetzelfde gedrag bij
expliciete selectie. Deze paden overschrijven `plugins.deny` of een algemene
instelling `plugins.enabled: false` niet. Een directe uitvoering van
`openclaw plugins install @openclaw/clickclack` volgt het normale
Plugin-installatiebeleid en registreert ClickClack ook in een bestaande
toegestane lijst.

## Meerdere bots

Elk account opent een eigen realtimeverbinding met ClickClack en gebruikt een eigen bottoken.

```json5
{
  channels: {
    clickclack: {
      enabled: true,
      baseUrl: "https://clickclack.example.com",
      defaultAccount: "service",
      accounts: {
        service: {
          token: { source: "env", provider: "default", id: "CLICKCLACK_SERVICE_BOT_TOKEN" },
          workspace: "default",
          defaultTo: "channel:general",
          agentId: "service-bot",
        },
        support: {
          token: { source: "env", provider: "default", id: "CLICKCLACK_SUPPORT_BOT_TOKEN" },
          workspace: "default",
          defaultTo: "dm:usr_...",
          agentId: "support-bot",
        },
      },
    },
  },
}
```

## Antwoordmodi

- `replyMode: "agent"` (standaard) stuurt inkomende berichten door de normale agentpijplijn, inclusief sessieregistratie en hulpmiddelenbeleid.
- `replyMode: "model"` slaat de agentpijplijn over en gebruikt `llm.complete` van de Plugin-runtime voor korte, directe botantwoorden (optioneel vormgegeven door `model` en `systemPrompt`).

De modelmodus voert voltooiingen uit op basis van de afgeleide agent-id van de bot. Hiervoor is de expliciete vertrouwensoptie `plugins.entries.clickclack.llm.allowAgentIdOverride: true` vereist:

```json5
{
  plugins: {
    entries: {
      clickclack: {
        llm: {
          allowAgentIdOverride: true,
        },
      },
    },
  },
}
```

Laat de vertrouwensoptie uitgeschakeld als je alleen de standaardantwoordmodus `agent` gebruikt; daarvoor is deze niet nodig.

Gebruik de modus `agent` voor correlatiebewijs tussen services. Voor een gezaghebbende ClickClack-bericht-id in de canonieke vorm `msg_<ulid>` leidt het kanaal de deterministische OpenClaw-uitvoerings-id `clickclack:<message-id>` af. Elke modelaanroep is vervolgens in diagnostische gegevens zichtbaar als `clickclack:<message-id>:model:<n>`; wanneer die beurt ClawRouter gebruikt, wordt dezelfde modelaanroep-id verzonden als `X-Request-ID`. De modus `model` omzeilt de normale diagnostische gegevens voor agentuitvoeringen en sessies en is daarom niet geschikt voor dit bewijspad.

Wanneer een realtimegebeurtenis een gevalideerde `payload.correlation_id` bevat, geeft het kanaal deze door als `X-Correlation-ID` bij het ophalen van het gezaghebbende bericht en bij de daaruit voortvloeiende ClickClack-antwoordverzoeken. Waarden gebruiken de veilige verzameling van 128 tekens van ClickClack (`A-Z`, `a-z`, `0-9`, `.`, `_`, `:` en `-`); ongeldige waarden worden weggelaten. Deze koppelingen bevatten uitsluitend identificatoren, nooit berichtinhoud, prompts, voltooiingen, referenties of hulpmiddelenuitvoer.

## Rijen met agentactiviteit

Standaard toont een ClickClack-kanaal niets terwijl een agentbeurt wordt uitgevoerd; alleen het definitieve antwoord wordt geplaatst. Stel `agentActivity: true` in voor een account om duurzame berichtrijen van het type `agent_commentary` en `agent_tool` te publiceren terwijl de beurt wordt uitgevoerd:

```json5
{
  channels: {
    clickclack: {
      enabled: true,
      token: { source: "env", provider: "default", id: "CLICKCLACK_BOT_TOKEN" },
      workspace: "default",
      agentActivity: true,
    },
  },
}
```

Vereisten en gedrag:

- **Standaard uitgeschakeld.** Standaardconfiguraties en oudere ClickClack-servers blijven onaangetast.
- **Vereist het tokenbereik `agent_activity:write`.** Dit bereik staat los van `bot:write` en wordt er niet van overgenomen; maak het bottoken aan met `--scopes bot:write,agent_activity:write` (of verleen het bereik aan een bestaand token) voordat je de optie inschakelt.
- **Best-effort-terugval.** Als het token `agent_activity:write` mist of de server activiteitsschrijfbewerkingen weigert, worden fouten geregistreerd en wordt het definitieve antwoord nog steeds normaal afgeleverd; er verschijnen geen activiteitsrijen.
- Rijen worden per beurt (`turn_id`) gegroepeerd en samengevoegd, zodat één logische stap één rij vormt. Hulpmiddelenrijen gebruiken dezelfde voortgangsopmaak als Discord/Slack/Telegram (naam van het hulpmiddel plus opdrachtdetails).
- **Toeschrijvingsmetadata.** Door agents geschreven berichten (activiteitsrijen en het definitieve antwoord) bevatten de velden `author_model` en `author_thinking`, afgeleid van het model dat daadwerkelijk voor de beurt is gebruikt (ook na terugval). Servers die deze kolommen niet definiëren, negeren de onbekende JSON-velden; servers die ze opslaan, kunnen per bericht de vraag beantwoorden: "welk model zei deze regel, op welk denkniveau".

## Doelen

- `channel:<name-or-id>` verzendt naar een werkruimtekanaal. Kale doelen gebruiken standaard `channel:`.
- `dm:<user_id>` maakt een rechtstreeks gesprek met die gebruiker aan of hergebruikt dit.
- `thread:<message_id>` antwoordt in de thread waarvan dat bericht het beginpunt is.

Expliciete uitgaande doelen mogen ook het providerprefix `clickclack:` of `cc:` bevatten.

Voorbeelden:

```bash
openclaw message send --channel clickclack --target channel:general --message "hello"
openclaw message send --channel clickclack --target dm:usr_123 --message "hello"
openclaw message send --channel clickclack --target thread:msg_123 --message "following up"
```

## Machtigingen

ClickClack-tokenbereiken worden afgedwongen door de ClickClack-API.

- `bot:read`: werkruimte-, kanaal-, bericht-, thread-, privébericht-, realtime- en profielgegevens lezen.
- `bot:write`: `bot:read` plus kanaalberichten, threadantwoorden, privéberichten en uploads.
- `bot:admin`: `bot:write` plus het maken van kanalen.
- `agent_activity:write`: duurzame rijen met agentactiviteit (`agent_commentary` / `agent_tool`). Wordt niet overgenomen door `bot:write` of `bot:admin`; alleen vereist wanneer `agentActivity: true` is ingesteld.

OpenClaw heeft voor normale agentchats alleen `bot:write` nodig. Voeg `agent_activity:write` toe wanneer je [rijen met agentactiviteit](#agent-activity-rows) inschakelt.

## Probleemoplossing

- `ClickClack is not configured for account "<id>"`: stel voor dat account `baseUrl`, `token` (bijvoorbeeld via `CLICKCLACK_BOT_TOKEN`) en `workspace` in.
- `ClickClack workspace not found: <value>`: stel `workspace` in op de werkruimte-id, slug of naam die ClickClack retourneert.
- Geen inkomende antwoorden: controleer of het token realtimeleestoegang heeft en houd er rekening mee dat de bot zijn eigen berichten en berichten van andere bots negeert.
- Verzenden naar kanalen mislukt: controleer of de bot lid is van de werkruimte en `bot:write` heeft.
