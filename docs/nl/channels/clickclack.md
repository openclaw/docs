---
read_when:
    - OpenClaw verbinden met een ClickClack-werkruimte
    - ClickClack-botidentiteiten testen
summary: ClickClack-kanaalconfiguratie met bottoken en doelsyntaxis
title: ClickClack
x-i18n:
    generated_at: "2026-07-16T15:06:46Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 2c422664ecdc9e41eb1810ca61654b886f1c51357fb9f48054d30c20a86ea8bc
    source_path: channels/clickclack.md
    workflow: 16
---

ClickClack verbindt OpenClaw met een zelfgehoste ClickClack-werkruimte via volwaardige ClickClack-bottokens.

Gebruik dit wanneer je wilt dat een OpenClaw-agent als ClickClack-botgebruiker verschijnt. ClickClack ondersteunt onafhankelijke servicebots en bots die eigendom zijn van gebruikers; bots die eigendom zijn van gebruikers behouden een `owner_user_id` en ontvangen alleen de tokenbereiken die je toekent.

## Snelle installatie

Open in ClickClack **Workspace settings → Integrations → OpenClaw**, maak een
bot en kopieer het token. Configureer vervolgens het kanaal:

```bash
openclaw channels add clickclack --base-url https://clickclack.example.com --token ccb_... --workspace default
```

`workspace` accepteert een werkruimte-id (`wsp_...`), slug of weergavenaam.
`channels add` verifieert na het opslaan de server, het token en de werkruimte en
meldt vervolgens of de actieve Gateway het nieuwe account heeft opgepikt. Als OpenClaw
al actief is, maakt ClickClack automatisch verbinding en is geen tweede opdracht
nodig. Start OpenClaw anders met:

```bash
openclaw gateway
```

Voer voor begeleide installatie het volgende uit:

```bash
openclaw onboard
```

Selecteer ClickClack en voer vervolgens de server-URL, het bottoken en de werkruimte in wanneer
hierom wordt gevraagd. De begeleide installatie controleert na het opslaan de server, het token en de werkruimte; bij een
mislukte controle wordt de configuratie niet verwijderd.

### Alternatief: token via omgevingsvariabele

Het standaardaccount kan `CLICKCLACK_BOT_TOKEN` lezen in plaats van een token
in de configuratie op te slaan:

```bash
export CLICKCLACK_BOT_TOKEN="ccb_..."
openclaw channels add clickclack --base-url https://clickclack.example.com --workspace default --use-env
openclaw gateway
```

Benoemde accounts moeten een geconfigureerd token of tokenbestand gebruiken; de gedeelde
omgevingsvariabele is bewust beperkt tot het standaardaccount.

### JSON5-referentie

De equivalente configuratiestructuur is:

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

Een account geldt alleen als geconfigureerd wanneer `baseUrl`, een tokenbron en
`workspace` allemaal zijn ingesteld. Een tokenbron kan `token`, `tokenFile` of
`CLICKCLACK_BOT_TOKEN` zijn voor het standaardaccount. `workspace` accepteert een werkruimte-
id (`wsp_...`), slug of naam; de Gateway zet deze bij het opstarten om naar de id.

### Configuratiesleutels voor accounts

| Sleutel                 | Standaard           | Opmerkingen                                                                             |
| ----------------------- | ------------------- | --------------------------------------------------------------------------------------- |
| `baseUrl`               | geen (vereist)      | URL van de ClickClack-server.                                                           |
| `token`                 | geen                | Bottoken als onbewerkte tekenreeks of geheime verwijzing (`source: "env" \| "file" \| "exec"`).          |
| `tokenFile`             | geen                | Pad naar een bestand met een bottoken; heeft voorrang op `token`.             |
| `workspace`             | geen (vereist)      | Werkruimte-id, slug of naam.                                                            |
| `replyMode`             | `"agent"`           | `"agent"` voert de volledige agentpijplijn uit; `"model"` verstuurt korte, rechtstreekse modelvoltooiingen. |
| `defaultTo`             | `"channel:general"` | Doel dat wordt gebruikt wanneer een uitgaand pad geen doel opgeeft.                     |
| `allowFrom`             | `["*"]`             | Toegestane lijst met gebruikers-id's voor inkomende privéberichten en kanaalberichten.  |
| `botUserId`             | automatisch gedetecteerd | Wordt bij het opstarten afgeleid van de identiteit van het bottoken.                |
| `agentId`               | standaardroute     | Zet de inkomende berichten van dit account vast op één agent.                           |
| `toolsAllow`            | geen                | Toegestane lijst met tools voor agentantwoorden vanaf dit account.                      |
| `model`, `systemPrompt` | geen                | Worden gebruikt door `replyMode: "model"`-voltooiingen.                                |
| `commandMenu`           | `true`              | Publiceer systeemeigen opdrachten in de automatische aanvulling van ClickClack Composer. |
| `reconnectMs`           | `1500`              | Vertraging voor realtime opnieuw verbinden (100 tot 60000).                             |

Als `plugins.allow` een niet-lege beperkende lijst is, wordt door ClickClack expliciet te selecteren
tijdens de kanaalinstallatie of door `openclaw plugins enable clickclack` uit te voeren
`clickclack` aan die lijst toegevoegd. Installatie tijdens onboarding gebruikt hetzelfde
gedrag voor expliciete selectie. Deze paden overschrijven `plugins.deny` of een
algemene instelling voor `plugins.enabled: false` niet. Rechtstreeks
`openclaw plugins install @openclaw/clickclack` uitvoeren volgt het normale
installatiebeleid voor plugins en legt ClickClack ook vast in een bestaande toegestane lijst.

## Meerdere bots

Elk account opent een eigen realtime ClickClack-verbinding en gebruikt een eigen bottoken.

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

- `replyMode: "agent"` (standaard) stuurt inkomende berichten door de normale agentpijplijn, inclusief sessieregistratie en toolbeleid.
- `replyMode: "model"` slaat de agentpijplijn over en gebruikt `llm.complete` van de pluginruntime voor rechtstreekse botantwoorden, eventueel vormgegeven door `model` en `systemPrompt`. De geselecteerde provider en het geselecteerde model bepalen het voltooiingsbudget.

De modelmodus voert voltooiingen uit voor de omgezette agent-id van de bot. Hiervoor is
de expliciete vertrouwens-
bit `plugins.entries.clickclack.llm.allowAgentIdOverride: true` vereist:

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

Laat de vertrouwensbit uitgeschakeld als je alleen de standaardantwoordmodus `agent` gebruikt; deze is
daar niet nodig.

## Opdrachtmenu

Bij het opstarten van de Gateway publiceert elk geconfigureerd account de systeemeigen
opdrachten van OpenClaw naar ClickClack. Ze verschijnen in de automatische aanvulling van de Composer, gelabeld met de
gebruikersnaam van de bot. De gepubliceerde verzameling wordt bij elke start volledig vervangen,
waarbij ook een verouderd menu wordt gewist wanneer de catalogus met systeemeigen opdrachten leeg is.

Synchronisatie van het opdrachtmenu is standaard ingeschakeld. Stel `commandMenu: false` in op een account
om dit uit te schakelen:

```json5
{
  channels: {
    clickclack: {
      enabled: true,
      token: { source: "env", provider: "default", id: "CLICKCLACK_BOT_TOKEN" },
      workspace: "default",
      commandMenu: false,
    },
  },
}
```

Het token heeft `commands:write` nodig. De huidige ClickClack-bundels `bot:write` en
`bot:admin` bevatten dat bereik; het kan ook
afzonderlijk worden toegekend. Aan tokens die zijn gemaakt voordat opdrachtmenu's werden geïntroduceerd, moet mogelijk het
bereik worden toegevoegd of ze moeten worden vervangen.

Synchronisatie gebeurt naar beste vermogen en wordt eenmaal per start van de Gateway uitgevoerd. Bij een ontbrekend bereik of een netwerk-
fout wordt een waarschuwing geregistreerd; bij een oudere ClickClack-server zonder het eindpunt wordt dit op
debugniveau geregistreerd. Geen van deze fouten blokkeert het realtime opstarten. Menu's blijven
beschikbaar terwijl de agent offline is en worden verwijderd wanneer de bot de
werkruimte verlaat.

Deze release publiceert alleen systeemeigen opdrachtspecificaties. Aliassen en
catalogi voor Skills, plugins of aangepaste opdrachten worden niet aan het menu toegevoegd. Als een
naam ook als HTTP-slashopdracht is geregistreerd, verwerkt ClickClack die
registratie eerst; andere menuopdrachten blijven via de normale bericht-
bezorging lopen.

Gebruik de modus `agent` voor correlatiebewijs tussen services. Voor een gezaghebbende
ClickClack-bericht-id in de canonieke vorm `msg_<ulid>` leidt het kanaal
de deterministische OpenClaw-run-id `clickclack:<message-id>` af. Elke modelaanroep is
vervolgens in diagnostische gegevens zichtbaar als `clickclack:<message-id>:model:<n>`; wanneer die
beurt ClawRouter gebruikt, wordt dezelfde modelaanroep-id verzonden als `X-Request-ID`.
De modus `model` omzeilt de normale diagnostische gegevens voor agentruns en sessies en is daarom
niet geschikt voor dit bewijspad.

Wanneer een realtime gebeurtenis een gevalideerde `payload.correlation_id` bevat, neemt het
kanaal deze mee als `X-Correlation-ID` bij het ophalen van het gezaghebbende bericht en
de resulterende ClickClack-antwoordverzoeken. Waarden gebruiken de veilige
tekenset van 128 tekens van ClickClack (`A-Z`, `a-z`, `0-9`, `.`, `_`, `:` en `-`); ongeldige waarden
worden weggelaten. Deze koppelingen bevatten uitsluitend identificatoren, nooit berichtinhoud,
prompts, voltooiingen, aanmeldgegevens of tooluitvoer.

## Duurzame mediabezorging

Agentantwoorden die media bevatten, gebruiken verplichte duurzame bezorging. OpenClaw wijst
vóór de eerste schrijfactie naar ClickClack stabiele bericht- en uploadnonces per onderdeel toe, zodat
bij een nieuwe poging dezelfde upload en hetzelfde bericht worden hergebruikt in plaats van opslagquotum te
verbruiken of duplicaten te publiceren. Als een upload na een herstart al bestaat,
leest OpenClaw het oorspronkelijke lokale pad of de externe media-URL niet opnieuw.

Voor dit herstelcontract is een ClickClack-server vereist die het volgende ondersteunt:

- `GET /api/uploads/by-nonce` met
  `X-ClickClack-Upload-Nonce: supported` voor gevonden en ontbrekende resultaten.
- `GET /api/messages/by-nonce` met
  `X-ClickClack-Message-Nonce: supported` voor gevonden en ontbrekende resultaten.
- Idempotente aanmaak van berichten en koppeling van bijlagen voor dezelfde
  nonce en upload binnen het eigenaarsbereik.

Een generieke 404 van een oudere server wordt niet beschouwd als bewijs dat een verzending ontbreekt.
OpenClaw laat de bezorging onopgelost in plaats van het risico op een duplicaat te nemen; werk
ClickClack bij voordat je agentantwoorden inschakelt die media produceren.

## Activiteitsrijen van agents

Standaard toont een ClickClack-kanaal niets terwijl een agentbeurt wordt uitgevoerd; alleen het uiteindelijke antwoord verschijnt. Stel `agentActivity: true` in op een account om duurzame berichtrijen voor `agent_commentary` en `agent_tool` te publiceren terwijl de beurt wordt uitgevoerd:

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

- **Standaard uitgeschakeld.** Standaardinstallaties en oudere ClickClack-servers blijven ongewijzigd.
- **Vereist het tokenbereik `agent_activity:write`.** Dit bereik staat los van `bot:write` en wordt er niet van overgenomen; maak het bottoken aan met `--scopes bot:write,agent_activity:write` (of ken het bereik toe aan een bestaand token) voordat je de optie inschakelt.
- **Degradatie naar beste vermogen.** Als het token `agent_activity:write` niet heeft of de server schrijfacties voor activiteit weigert, worden fouten geregistreerd en wordt het uiteindelijke antwoord nog steeds normaal bezorgd; er verschijnen geen activiteitsrijen.
- Rijen worden per beurt gegroepeerd (`turn_id`), samengevoegd zodat één logische stap één rij vormt, en toolrijen gebruiken dezelfde voortgangsopmaak als Discord/Slack/Telegram (toolnaam plus opdrachtdetails).
- **Toeschrijvingsmetadata.** Door agents geschreven berichten (activiteitsrijen en het uiteindelijke antwoord) bevatten de velden `author_model` en `author_thinking`, afgeleid van het model dat daadwerkelijk voor de beurt is gebruikt (ook na terugval). Servers die deze kolommen niet definiëren, negeren de onbekende JSON-velden; servers die ze bewaren, kunnen per bericht de vraag beantwoorden: "welk model zei deze regel, op welk denkniveau".

## Doelen

- `channel:<name-or-id>` verzendt naar een werkruimtekanaal. Kale doelen gebruiken standaard `channel:`.
- `dm:<user_id>` maakt een direct gesprek met die gebruiker of hergebruikt een bestaand gesprek.
- `thread:<message_id>` antwoordt in de thread die bij dat bericht begint.

Expliciete uitgaande doelen kunnen ook het providerprefix `clickclack:` of `cc:` bevatten.

Voor uitgaande media wordt de upload-API van ClickClack gebruikt, waarna de duurzame upload
wordt toegevoegd aan het gemaakte kanaalbericht, het antwoord in de thread of het privébericht. Lokale bestanden en ondersteunde
externe media-URL's volgen het normale mediatoegangsbeleid van OpenClaw, met een limiet van 64 MiB
per bestand. Duurzame verzendtaken in de wachtrij gebruiken voor elke upload en elk berichtonderdeel afzonderlijke,
tot de eigenaar beperkte nonces en proberen vervolgens de koppeling van de bijlage opnieuw met diezelfde
objecten. Zie [Duurzame medialevering](#durable-media-delivery) voor het servercontract
en het herstelgedrag.

Voorbeelden:

```bash
openclaw message send --channel clickclack --target channel:general --message "hello"
openclaw message send --channel clickclack --target dm:usr_123 --message "hello"
openclaw message send --channel clickclack --target thread:msg_123 --message "following up"
```

## Machtigingen

De ClickClack-API dwingt de scopes van ClickClack-tokens af.

- `bot:read`: gegevens van werkruimten, kanalen, berichten, threads, privéberichten, realtimegegevens en profielen lezen.
- `bot:write`: `bot:read` plus kanaalberichten, antwoorden in threads, privéberichten, uploads en publicatie van het opdrachtenmenu.
- `bot:admin`: `bot:write` plus het maken van kanalen.
- `commands:write`: het opdrachtenmenu van de bot publiceren. Opgenomen in de huidige bundels `bot:write` en `bot:admin` en afzonderlijk toekenbaar.
- `agent_activity:write`: duurzame rijen met agentactiviteit (`agent_commentary` / `agent_tool`). Niet overgenomen door `bot:write` of `bot:admin`; alleen vereist wanneer `agentActivity: true` is ingesteld.

OpenClaw heeft voor normale chats met de agent en synchronisatie van het opdrachtenmenu alleen de huidige `bot:write` nodig. Voeg `agent_activity:write` toe wanneer je [rijen met agentactiviteit](#agent-activity-rows) inschakelt.

## Problemen oplossen

- `ClickClack is not configured for account "<id>"`: stel voor dat account `baseUrl`, `token` (bijvoorbeeld via `CLICKCLACK_BOT_TOKEN`) en `workspace` in.
- `ClickClack workspace not found: <value>`: stel `workspace` in op de werkruimte-id, slug of naam die ClickClack retourneert.
- Geen inkomende antwoorden: controleer of het token realtime leestoegang heeft en houd er rekening mee dat de bot zijn eigen berichten en berichten van andere bots negeert.
- Verzenden naar kanalen mislukt: controleer of de bot lid is van de werkruimte en over `bot:write` beschikt.
- Geen opdrachtenmenu: controleer of `commandMenu` niet `false` is, de ClickClack-server `PUT /api/bots/self/commands` ondersteunt en het token over `commands:write` beschikt.
