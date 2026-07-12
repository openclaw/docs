---
read_when:
    - Je wilt dat een agent vanaf je telefoon je echte Chrome-browser aanstuurt waarin je bent ingelogd
    - Je krijgt steeds de Chrome-melding ‘Allow remote debugging?’ terwijl er niemand achter het bureau zit
    - U wilt het beveiligingsmodel van browserovername via de extensie begrijpen
summary: 'Chrome-extensie: laat OpenClaw uw aangemelde Chrome bedienen zonder prompt voor foutopsporing op afstand'
title: Chrome-extensie
x-i18n:
    generated_at: "2026-07-12T09:20:59Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: cb3f7d4bd9d933e0e876d21a1edf07bafbdc18d0196ce636981bd11ad5f2facd
    source_path: tools/chrome-extension.md
    workflow: 16
---

# Chrome-extensie

Met de OpenClaw Chrome-extensie kan een agent je **aangemelde Chrome-tabbladen**
besturen zonder een afzonderlijke beheerde browser te starten en **zonder** de
blokkerende melding 'Allow remote debugging?' van Chrome.

Dit is belangrijk wanneer je OpenClaw vanaf een telefoon aanstuurt (Telegram,
WhatsApp enzovoort): het [`user`-profiel](/nl/tools/browser#profiles-openclaw-user-chrome)
maakt verbinding via de poort voor foutopsporing op afstand van Chrome, waardoor
op het bureaublad een toestemmingsvenster verschijnt waarop niemand kan klikken
wanneer je niet aanwezig bent. De extensie gebruikt in plaats daarvan de
`chrome.debugger`-API, zodat de enige aanwijzing op de pagina de sluitbare
Chrome-banner 'OpenClaw started debugging this browser' is.

Dit is dezelfde opzet die wordt gebruikt door de Chrome-extensies Claude in
Chrome van Anthropic en Codex van OpenAI.

## Werking

Drie onderdelen:

- **Browserbesturingsservice** (Gateway- of Node-host): de API die door de
  `browser`-tool wordt aangeroepen.
- **Extensierelay** (local loopback-WebSocket): een kleine server die door de
  besturingsservice op `127.0.0.1` wordt gestart. Deze biedt OpenClaw een
  Chrome DevTools Protocol-eindpunt en communiceert met de extensie. Beide
  zijden verifiëren zich met een hostlokaal token (zie hieronder).
- **OpenClaw Chrome-extensie** (MV3): maakt met `chrome.debugger` verbinding met
  tabbladen, stuurt CDP-verkeer door en beheert de **OpenClaw-tabbladgroep**.

OpenClaw ziet en bestuurt alleen tabbladen die zich in de
**OpenClaw-tabbladgroep** bevinden. De groep vormt de toestemmingsgrens: sleep
een tabblad erin om het te delen en sleep het eruit (of klik op de werkbalkknop)
om de toegang onmiddellijk in te trekken.

## Installeren en koppelen

1. Geef het pad naar de uitgepakte extensie weer:

   ```bash
   openclaw browser extension path
   ```

2. Open `chrome://extensions`, schakel **Developer mode** in, klik op **Load
   unpacked** en selecteer de weergegeven map.

3. Geef de koppelingsreeks weer:

   ```bash
   openclaw browser extension pair
   ```

4. Klik op het OpenClaw-pictogram in de werkbalk en plak de koppelingsreeks in
   het pop-upvenster. De badge verandert in **ON** wanneer de extensie verbinding
   maakt met de relay.

Het koppelingstoken is een **hostlokaal geheim** dat bij het eerste gebruik
wordt aangemaakt en onder `credentials/` in de statusmap wordt opgeslagen
(modus `0600`). Elke machine waarop een browser wordt uitgevoerd — de
Gateway-host en elke browser-Node-host — heeft een eigen token, zodat er geen
aanmeldgegevens tussen machines hoeven te worden uitgewisseld. Verwijder het
bestand `browser-extension-relay.secret` en koppel opnieuw om het token te
vervangen.

## Gebruik

Selecteer het ingebouwde `chrome`-profiel in een aanroep van de `browser`-tool
of stel het in als standaardprofiel:

```bash
openclaw config set browser.defaultProfile chrome
```

```json5
{
  browser: {
    profiles: {
      chrome: { driver: "extension", color: "#FF4500" },
    },
  },
}
```

- Een tabblad delen: klik op dat tabblad op de OpenClaw-knop in de werkbalk
  (het wordt aan de OpenClaw-tabbladgroep toegevoegd), of sleep een willekeurig
  tabblad naar de groep.
- De agent kan ook nieuwe tabbladen openen; deze worden automatisch aan de
  groep toegevoegd.
- Toegang intrekken: klik nogmaals op de knop, sleep het tabblad uit de groep of
  sluit de foutopsporingsbanner van Chrome. De agent verliest onmiddellijk de
  toegang tot dat tabblad.

## Extern / tussen machines

Chrome hoeft niet op de Gateway-host te worden uitgevoerd. Er zijn drie
mogelijke topologieën:

- **Dezelfde host** (Gateway + Chrome op één machine): koppel op die machine met
  `openclaw browser extension pair`. De relay is uitsluitend via local loopback
  bereikbaar.
- **Rechtstreeks naar een externe Gateway** (Chrome op je laptop, Gateway op
  een VPS en **niets anders op de laptop**): voer op de Gateway
  `openclaw browser extension pair --gateway-url wss://your-gateway.example.com`
  uit. Hiermee wordt een reeks van de vorm
  `wss://…/browser/extension#<secret>` weergegeven; laad en koppel de extensie
  op de laptop. De extensie maakt via `wss://` **rechtstreeks verbinding met de
  Gateway** — zonder installatie van OpenClaw, Node of CLI en zonder een
  geopende inkomende poort op de laptop. Dit is het pad voor beheerde hosting.
- **Via een browser-Node-host** (Chrome op een machine waarop al een OpenClaw-Node
  wordt uitgevoerd): voer `pair` uit op de Node en koppel lokaal; de Gateway
  stuurt browseracties door naar de Node via de bestaande geverifieerde
  Node-verbinding.

Het koppelingsgeheim geldt per host (in het rechtstreekse geval dat van de
Gateway) en wordt door de route `/browser/extension` van de Gateway gevalideerd.
Bied voor het rechtstreekse pad de Gateway aan via TLS (`wss://`), zodat het
koppelingsgeheim en CDP-verkeer worden versleuteld. Het geheim blijft in het
URL-fragment van de koppelingsreeks en wordt tijdens de WebSocket-handshake als
subprotocolaanmeldgegeven aangeboden, zodat normale toegangslogboeken van
proxy's het niet in de aanvraag-URL ontvangen. Zorg ervoor dat een eventuele
reverse proxy de standaardheader `Sec-WebSocket-Protocol` behoudt.

## Diagnostiek

```bash
openclaw browser status --browser-profile chrome
openclaw browser doctor --browser-profile chrome
```

`doctor` meldt dat de controle **Chrome extension relay** mislukt totdat in het
pop-upvenster van de extensie **Connected** wordt weergegeven.

## Beveiligingsmodel

- De relay bindt alleen aan local loopback; beide WebSocket-zijden worden met
  het afgeleide token geverifieerd en voor de extensiezijde wordt gecontroleerd
  of de oorsprong `chrome-extension://` is.
- Bij rechtstreekse koppeling met de Gateway wordt het relaytoken niet in de
  aanvraag-URL geaccepteerd; de meegeleverde extensie neemt het in plaats
  daarvan op in de lijst met WebSocket-subprotocollen.
- De agent kan alleen tabbladen in de **OpenClaw-tabbladgroep** zien en
  besturen. Je andere tabbladen blijven privé.
- Vergeleken met het `user`-profiel (Chrome MCP), dat je volledige aangemelde
  browser beschikbaar stelt zodra je de melding voor foutopsporing op afstand
  goedkeurt, beperkt de extensie het gedeelde oppervlak tot een tabbladgroep
  die je in één oogopslag beheert.

Zie ook: [Browser](/nl/tools/browser) voor het volledige profielmodel en de
beheerde profielen `openclaw` en Chrome MCP `user`.
