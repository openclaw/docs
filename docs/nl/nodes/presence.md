---
read_when:
    - Je wilt dat OpenClaw de actieve Mac identificeert
    - Je debugt de activiteit van de laatste invoer of de selectie van de actieve Node
    - Je wilt de routering van meldingen over Node-verbindingen begrijpen
summary: Detecteer de Mac die je het laatst hebt gebruikt en stuur Node-meldingen daarheen
title: Actieve computeraanwezigheid
x-i18n:
    generated_at: "2026-07-16T16:00:35Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 2a4ec4607e1e4ef8d989d3c4ece0ee6e0730908a1df76ff52c1898b4307d979b
    source_path: nodes/presence.md
    workflow: 16
---

Actieve computeraanwezigheid vertelt de Gateway welke verbonden macOS-node
de meest recente fysieke muis- of toetsenbordinvoer heeft ontvangen. OpenClaw gebruikt dat signaal om
één Mac als `active` te markeren, de agent een stabiele hint voor de actieve node te geven en
waarschuwingen over nodeverbindingen te routeren naar de computer waarbij je waarschijnlijk aanwezig bent.

Dit staat los van [systeemaanwezigheid](/nl/concepts/presence), de actuele
lijst met Gateway-clients, en van duurzame `node.presence.alive`-bakens, die
vastleggen wanneer een mobiele node voor het laatst is geactiveerd zonder deze als verbonden te beschouwen.

## Vereisten

- De OpenClaw-app voor macOS is gekoppeld en verbonden in nodemodus.
- De toestemming **Accessibility** is verleend aan de ondertekende OpenClaw-app.
- Voor verbindingswaarschuwingen is ook de toestemming **Notifications** verleend en stelt de
  Mac-node `system.notify` beschikbaar.

Activiteitsrapportage is momenteel geïmplementeerd door de native macOS-node. iOS-,
Android-, watchOS- en headless nodehosts kunnen de verbindingsstatus of de
laatst-gezienstatus op de achtergrond rapporteren, maar dingen niet mee naar de aanduiding als actieve computer.

## De actieve computer controleren

1. Open in de macOS-app **Settings -> Permissions** en verleen
   **Accessibility** in macOS System Settings.
2. Controleer of de Mac-node verbonden is:

   ```bash
   openclaw nodes status --connected
   ```

3. Beweeg de muis of druk op een toets op die Mac en voer vervolgens het volgende uit:

   ```bash
   openclaw nodes status
   openclaw nodes describe --node <node-id-or-name>
   ```

De recentste geschikte Mac wordt gemarkeerd als `active`. De statusuitvoer toont hoe lang
geleden de laatste invoer plaatsvond; `describe` stelt `active`, `lastActiveAtMs` en `presenceUpdatedAtMs` beschikbaar.
Activiteit wordt bewust samengevoegd, waardoor het na een recente rapportage tot ongeveer 15
seconden kan duren voordat andere invoer in de weergave verschijnt.

## Hoe activiteit aanwezigheid wordt

De macOS-rapporteur bemonstert elke twee seconden de inactiviteitsklok van het HID-systeem. Deze
rapporteert één keer wanneer een nodeverbinding gereed is en rapporteert vervolgens nieuwere fysieke
activiteit maximaal één keer per 15 seconden. Tijdens inactiviteit verzendt deze elke drie minuten
een keepalive. De duur van de inactiviteit is beperkt tot 30 dagen, zodat een zeer oud meetpunt
niet vooruit kan verschuiven en ten onrechte de nieuwste computer kan worden.

De Gateway accepteert activiteit alleen wanneer aan al deze voorwaarden wordt voldaan:

- de gebeurtenis behoort tot de huidige geauthenticeerde verbinding voor die node-id;
- de node heeft daadwerkelijk de toestemming `accessibility: true`;
- de payload bevat een begrensde gehele waarde voor `idleSeconds`.

De Gateway trekt `idleSeconds` af van zijn eigen waarnemingstijd om
`lastActiveAtMs` af te leiden. Een door een node aangeleverd tijdstempel van de systeemklok wordt nooit vertrouwd. Van de
verbonden geschikte Macs wint de nieuwste `lastActiveAtMs`; bij een gelijke stand wordt de
recentste aanwezigheidsupdate gebruikt.

Aanwezigheid is proceslokaal en aan de verbinding gebonden. Als de huidige
sessie wordt verbroken, wordt vervangen door een andere sessie met dezelfde node-id, of als
Accessibility wordt ingetrokken, wordt de activiteitsstatus van die node gewist en wordt de actieve Mac opnieuw bepaald.

## Privacy en modelcontext

OpenClaw verzendt de duur van de inactiviteit, niet de inhoud van de invoer. Het verzendt geen toetswaarden,
muiscoördinaten, applicatienamen, venstertitels of onbewerkte invoergebeurtenissen. De
macOS-rapporteur leest de hardwarematige HID-status, zodat synthetische computerbesturingsgebeurtenissen
een geautomatiseerde Mac niet laten lijken op de computer die je fysiek hebt gebruikt.

Voortdurende activiteit maakt geen systeemgebeurtenissen aan die zichtbaar zijn voor het model. De dynamische
runtimeregel bevat alleen de geauthenticeerde node-id:

```text
active_node=<node-id>
```

Exacte tijdstempels en door de node beheerde weergavenamen blijven buiten de prompt om
promptinjectie en cacheverloop te voorkomen. Wanneer de agent actuele details nodig heeft,
kan de tool `nodes` in plaats daarvan `node.list` of `node.describe` lezen.

## Hoe verbindingswaarschuwingen worden gerouteerd

Nadat een node de Gateway-handshake heeft voltooid, wacht OpenClaw 750 milliseconden zodat
de verbindende Mac zijn eerste activiteitsmeetpunt kan indienen. Vervolgens probeert het
de verbonden Mac met meldingsmogelijkheden en de recentste activiteit.

- Als de primaire bezorging slaagt, ontvangt geen enkele andere Mac de waarschuwing.
- Als er geen actieve Mac beschikbaar is of de primaire bezorging mislukt, wacht OpenClaw vijf
  seconden en probeert het elke overige verbonden Mac die `system.notify` beschikbaar stelt.
- Een waarschuwing voor een nieuwe verbinding van dezelfde node wordt gedurende vijf minuten na een
  daadwerkelijke bezorgpoging onderdrukt, zodat steeds opnieuw verbinden geen
  meldingenstorm veroorzaakt.

Waarschuwingen zijn aan exacte nodeverbindingen gebonden. Een verbroken of vervangen bronsessie
kan een oude geplande waarschuwing niet voltooien en een vervangende doelverbinding
kan nog steeds deelnemen aan de fallbackbezorging.

## Problemen oplossen

| Symptoom                                  | Controle                                                                                                                                                             |
| ----------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Geen enkele rij is gemarkeerd als `active` | Controleer of een native macOS-node verbonden is en of `openclaw nodes describe --node <id>` `permissions.accessibility: true` toont.                                          |
| De verkeerde Mac blijft actief            | Gebruik die Mac fysiek, wacht tot het samenvoegingsvenster is verstreken en voer `openclaw nodes status` opnieuw uit. Synthetische computerbesturingsacties tellen niet mee. |
| Gegevens over de laatste invoer verdwijnen | Controleer of de verbinding met de Mac is verbroken, de nodesessie is vervangen of Accessibility is ingetrokken. Elke voorwaarde wist de activiteit bewust.           |
| De waarschuwing verschijnt op meerdere Macs | De primaire bezorging was niet beschikbaar of is mislukt, waardoor de vertraagde fallback is uitgevoerd. Controleer of de actieve Mac verbonden is, meldingen toestaat en `system.notify` beschikbaar stelt. |
| De agent vermeldt de actieve Mac niet     | Begin een nieuwe beurt nadat de activiteit is gewijzigd. De runtimehint is stabiel en compact; gebruik de tool `nodes` voor exacte actuele metagegevens.    |

Zie [macOS-machtigingen](/nl/platforms/mac/permissions) voor TCC-herstel. Zie
[Problemen met nodes oplossen](/nl/nodes/troubleshooting) voor fouten met nodeverbindingen en opdrachten.

## Gerelateerd

- [Nodes](/nl/nodes)
- [Nodes-CLI](/nl/cli/nodes)
- [Systeemaanwezigheid](/nl/concepts/presence)
- [Gateway-protocol](/nl/gateway/protocol#presence)
- [macOS-app](/nl/platforms/macos)
