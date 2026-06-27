---
read_when:
    - De Android-node koppelen of opnieuw verbinden
    - Foutopsporing voor Android-Gateway-detectie of authenticatie
    - Chatgeschiedenispariteit tussen clients verifiëren
summary: 'Android-app (node): draaiboek voor verbinding + opdrachtoppervlak voor Connect/Chat/Voice/Canvas'
title: Android-app
x-i18n:
    generated_at: "2026-06-27T17:46:38Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 5c02d4921c3f3011c09e564d83b773a7c155d17a82a6e70d3fd3e973597142f1
    source_path: platforms/android.md
    workflow: 16
---

<Note>
De officiële Android-app is beschikbaar op [Google Play](https://play.google.com/store/apps/details?id=ai.openclaw.app&hl=en_IN). Het is een bijbehorende Node en vereist een actieve OpenClaw Gateway. De broncode is ook beschikbaar in de [OpenClaw-repository](https://github.com/openclaw/openclaw) onder `apps/android`; zie [apps/android/README.md](https://github.com/openclaw/openclaw/blob/main/apps/android/README.md) voor buildinstructies.
</Note>

## Ondersteuningssnapshot

- Rol: bijbehorende Node-app (Android host de Gateway niet).
- Gateway vereist: ja (voer deze uit op macOS, Linux of Windows via WSL2).
- Installeren: [Google Play](https://play.google.com/store/apps/details?id=ai.openclaw.app&hl=en_IN) voor de app, [Aan de slag](/nl/start/getting-started) voor de Gateway, daarna [Koppelen](/nl/channels/pairing).
- Gateway: [Runbook](/nl/gateway) + [Configuratie](/nl/gateway/configuration).
  - Protocollen: [Gateway-protocol](/nl/gateway/protocol) (Nodes + besturingsvlak).

## Systeembeheer

Systeembeheer (launchd/systemd) bevindt zich op de Gateway-host. Zie [Gateway](/nl/gateway).

## Verbindingsrunbook

Android-Node-app ⇄ (mDNS/NSD + WebSocket) ⇄ **Gateway**

Android maakt rechtstreeks verbinding met de Gateway-WebSocket en gebruikt apparaatkoppeling (`role: node`).

Voor Tailscale of openbare hosts vereist Android een veilig endpoint:

- Voorkeur: Tailscale Serve / Funnel met `https://<magicdns>` / `wss://<magicdns>`
- Ook ondersteund: elke andere `wss://` Gateway-URL met een echt TLS-endpoint
- Cleartext `ws://` blijft ondersteund op privé-LAN-adressen / `.local`-hosts, plus `localhost`, `127.0.0.1` en de Android-emulatorbrug (`10.0.2.2`)

### Vereisten

- Je kunt de Gateway uitvoeren op de "master"-machine.
- Android-apparaat/emulator kan de Gateway-WebSocket bereiken:
  - Hetzelfde LAN met mDNS/NSD, **of**
  - Dezelfde Tailscale-tailnet met Wide-Area Bonjour / unicast DNS-SD (zie hieronder), **of**
  - Handmatige Gateway-host/poort (fallback)
- Mobiele koppeling via tailnet/openbaar gebruikt **geen** ruwe tailnet-IP-`ws://`-endpoints. Gebruik in plaats daarvan Tailscale Serve of een andere `wss://`-URL.
- Je kunt de CLI (`openclaw`) uitvoeren op de Gateway-machine (of via SSH).

### 1) Start de Gateway

```bash
openclaw gateway --port 18789 --verbose
```

Bevestig dat je in de logs iets ziet zoals:

- `listening on ws://0.0.0.0:18789`

Voor externe Android-toegang via Tailscale heeft Serve/Funnel de voorkeur boven een ruwe tailnet-bind:

```bash
openclaw gateway --tailscale serve
```

Dit geeft Android een veilig `wss://` / `https://`-endpoint. Een gewone `gateway.bind: "tailnet"`-configuratie is niet genoeg voor eerste externe Android-koppeling, tenzij je TLS ook apart beëindigt.

### 2) Verifieer ontdekking (optioneel)

Vanaf de Gateway-machine:

```bash
dns-sd -B _openclaw-gw._tcp local.
```

Meer debugnotities: [Bonjour](/nl/gateway/bonjour).

Als je ook een wide-area ontdekkingsdomein hebt geconfigureerd, vergelijk dan met:

```bash
openclaw gateway discover --json
```

Dat toont `local.` plus het geconfigureerde wide-area domein in één doorgang en gebruikt het opgeloste
service-endpoint in plaats van alleen TXT-hints.

#### Tailnet-ontdekking (Wenen ⇄ Londen) via unicast DNS-SD

Android NSD/mDNS-ontdekking gaat niet over netwerkgrenzen heen. Als je Android-Node en de Gateway zich op verschillende netwerken bevinden maar via Tailscale verbonden zijn, gebruik dan Wide-Area Bonjour / unicast DNS-SD.

Ontdekking alleen is niet voldoende voor tailnet/openbare Android-koppeling. De ontdekte route heeft nog steeds een veilig endpoint nodig (`wss://` of Tailscale Serve):

1. Stel een DNS-SD-zone in (voorbeeld `openclaw.internal.`) op de Gateway-host en publiceer `_openclaw-gw._tcp`-records.
2. Configureer Tailscale split DNS voor je gekozen domein, wijzend naar die DNS-server.

Details en voorbeeld-CoreDNS-configuratie: [Bonjour](/nl/gateway/bonjour).

### 3) Verbinden vanaf Android

In de Android-app:

- De app houdt de Gateway-verbinding actief via een **voorgrondservice** (persistente melding).
- Open het tabblad **Verbinden**.
- Gebruik de modus **Installatiecode** of **Handmatig**.
- Als ontdekking geblokkeerd is, gebruik dan handmatige host/poort in **Geavanceerde bedieningselementen**. Voor privé-LAN-hosts werkt `ws://` nog steeds. Schakel voor Tailscale/openbare hosts TLS in en gebruik een `wss://` / Tailscale Serve-endpoint.

Na de eerste geslaagde koppeling maakt Android bij het starten automatisch opnieuw verbinding:

- Handmatig endpoint (indien ingeschakeld), anders
- De laatst ontdekte Gateway (naar beste vermogen).

### Presence alive-beacons

Nadat de geauthenticeerde Node-sessie verbinding maakt, en wanneer de app naar de achtergrond gaat terwijl de
voorgrondservice nog verbonden is, roept Android `node.event` aan met
`event: "node.presence.alive"`. De Gateway registreert dit als `lastSeenAtMs`/`lastSeenReason` in de
gekoppelde Node-/apparaatmetadata, maar pas nadat de geauthenticeerde Node-apparaatidentiteit bekend is.

De app telt de beacon alleen als succesvol geregistreerd wanneer de Gateway-respons
`handled: true` bevat. Oudere Gateways kunnen `node.event` bevestigen met `{ "ok": true }`; die respons is
compatibel maar telt niet als een duurzame last-seen-update.

### 4) Koppeling goedkeuren (CLI)

Op de Gateway-machine:

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw devices reject <requestId>
```

Koppelingsdetails: [Koppelen](/nl/channels/pairing).

Optioneel: als de Android-Node altijd verbinding maakt vanaf een strikt gecontroleerd subnet,
kun je kiezen voor automatische goedkeuring bij eerste Node-koppeling met expliciete CIDR's of exacte IP's:

```json5
{
  gateway: {
    nodes: {
      pairing: {
        autoApproveCidrs: ["192.168.1.0/24"],
      },
    },
  },
}
```

Dit is standaard uitgeschakeld. Het geldt alleen voor nieuwe `role: node`-koppelingen zonder
aangevraagde scopes. Operator-/browserkoppeling en elke wijziging in rol, scope, metadata of
openbare sleutel vereisen nog steeds handmatige goedkeuring.

### 5) Verifieer dat de Node verbonden is

- Via Nodes-status:

  ```bash
  openclaw nodes status
  ```

- Via Gateway:

  ```bash
  openclaw gateway call node.list --params "{}"
  ```

### 6) Chat + geschiedenis

Het Android-tabblad Chat ondersteunt sessieselectie (standaard `main`, plus andere bestaande sessies):

- Geschiedenis: `chat.history` (weergave-genormaliseerd; inline directive-tags worden
  uit zichtbare tekst verwijderd, XML-payloads voor tool-calls in platte tekst (waaronder
  `<tool_call>...</tool_call>`, `<function_call>...</function_call>`,
  `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>` en
  afgekorte tool-call-blokken) en gelekte ASCII-/full-width modelbesturingstokens
  worden verwijderd, pure stille-token-assistentrijen zoals exacte `NO_REPLY` /
  `no_reply` worden weggelaten, en te grote rijen kunnen worden vervangen door placeholders)
- Verzenden: `chat.send`
- Push-updates (naar beste vermogen): `chat.subscribe` → `event:"chat"`

### 7) Canvas + camera

#### Gateway Canvas-host (aanbevolen voor webinhoud)

Als je wilt dat de Node echte HTML/CSS/JS toont die de agent op schijf kan bewerken, wijs de Node dan naar de Gateway Canvas-host.

<Note>
Nodes laden canvas vanaf de Gateway-HTTP-server (dezelfde poort als `gateway.port`, standaard `18789`).
</Note>

1. Maak `~/.openclaw/workspace/canvas/index.html` aan op de Gateway-host.

2. Navigeer de Node ernaartoe (LAN):

```bash
openclaw nodes invoke --node "<Android Node>" --command canvas.navigate --params '{"url":"http://<gateway-hostname>.local:18789/__openclaw__/canvas/"}'
```

Tailnet (optioneel): als beide apparaten op Tailscale zitten, gebruik dan een MagicDNS-naam of tailnet-IP in plaats van `.local`, bijvoorbeeld `http://<gateway-magicdns>:18789/__openclaw__/canvas/`.

Deze server injecteert een live-reload-client in HTML en herlaadt bij bestandswijzigingen.
De Gateway serveert ook `/__openclaw__/a2ui/`, maar de Android-app behandelt externe A2UI-pagina's als alleen-renderen. Actiegeschikte A2UI-commando's gebruiken de gebundelde app-eigen A2UI-pagina voordat berichten worden toegepast.

Canvas-commando's (alleen voorgrond):

- `canvas.eval`, `canvas.snapshot`, `canvas.navigate` (gebruik `{"url":""}` of `{"url":"/"}` om terug te keren naar de standaardscaffold). `canvas.snapshot` retourneert `{ format, base64 }` (standaard `format="jpeg"`).
- A2UI: `canvas.a2ui.push`, `canvas.a2ui.reset` (`canvas.a2ui.pushJSONL` legacy alias). Deze commando's gebruiken de gebundelde app-eigen A2UI-pagina voor actiegeschikte rendering.

Camera-commando's (alleen voorgrond; toestemmingsgebonden):

- `camera.snap` (jpg)
- `camera.clip` (mp4)

Zie [Camera-Node](/nl/nodes/camera) voor parameters en CLI-helpers.

### 8) Spraak + uitgebreid Android-commandosurface

- Spraaktabblad: Android heeft twee expliciete opnamemodi. **Microfoon** is een handmatige sessie op het spraaktabblad die elke pauze als chatbeurt verzendt en stopt wanneer de app de voorgrond verlaat of de gebruiker het spraaktabblad verlaat. **Praten** is continue Talk Mode en blijft luisteren tot deze wordt uitgeschakeld of de Node de verbinding verbreekt.
- Talk Mode promoveert de bestaande voorgrondservice van `connectedDevice` naar `connectedDevice|microphone` voordat opname begint, en degradeert deze daarna wanneer Talk Mode stopt. De Node-service declareert `FOREGROUND_SERVICE_CONNECTED_DEVICE` met `CHANGE_NETWORK_STATE`; Android 14+ vereist ook de declaratie `FOREGROUND_SERVICE_MICROPHONE`, de runtime-toekenning `RECORD_AUDIO` en het microfoonservicetype tijdens runtime.
- Standaard gebruikt Android Talk native spraakherkenning, Gateway-chat en `talk.speak` via de geconfigureerde Gateway Talk-provider. Lokale systeem-TTS wordt alleen gebruikt wanneer `talk.speak` niet beschikbaar is.
- Android Talk gebruikt realtime Gateway-relay alleen wanneer `talk.realtime.mode` `realtime` is en `talk.realtime.transport` `gateway-relay` is.
- Voice wake blijft uitgeschakeld in de Android-UX/runtime.
- Aanvullende Android-commandofamilies (beschikbaarheid hangt af van apparaat, toestemmingen en gebruikersinstellingen):
  - `device.status`, `device.info`, `device.permissions`, `device.health`
  - `device.apps` alleen wanneer **Instellingen > Telefoonmogelijkheden > Geïnstalleerde apps** is ingeschakeld; het toont standaard apps die zichtbaar zijn in de launcher.
  - `notifications.list`, `notifications.actions` (zie [Meldingen doorsturen](#notification-forwarding) hieronder)
  - `photos.latest`
  - `contacts.search`, `contacts.add`
  - `calendar.events`, `calendar.add`
  - `callLog.search`
  - `sms.search`
  - `motion.activity`, `motion.pedometer`

## Assistent-entrypoints

Android ondersteunt het starten van OpenClaw via de systeemassistenttrigger (Google
Assistant). Wanneer dit is geconfigureerd, opent het ingedrukt houden van de thuisknop of zeggen van "Hey Google, ask
OpenClaw..." de app en geeft de prompt door aan de chatcomposer.

Dit gebruikt Android **App Actions**-metadata die in het appmanifest zijn gedeclareerd. Er is geen
extra configuratie nodig aan de Gateway-kant -- de assistent-intent wordt
volledig door de Android-app afgehandeld en doorgestuurd als een normaal chatbericht.

<Note>
De beschikbaarheid van App Actions hangt af van het apparaat, de versie van Google Play Services
en of de gebruiker OpenClaw heeft ingesteld als de standaardassistent-app.
</Note>

## Meldingen doorsturen

Android kan apparaatmeldingen als events doorsturen naar de Gateway. Met verschillende bedieningselementen kun je afbakenen welke meldingen worden doorgestuurd en wanneer.

| Sleutel                          | Type           | Beschrijving                                                                                      |
| -------------------------------- | -------------- | ------------------------------------------------------------------------------------------------- |
| `notifications.allowPackages`    | string[]       | Stuur alleen meldingen van deze pakketnamen door. Als dit is ingesteld, worden alle andere pakketten genegeerd. |
| `notifications.denyPackages`     | string[]       | Stuur nooit meldingen van deze pakketnamen door. Toegepast na `allowPackages`.                    |
| `notifications.quietHours.start` | string (HH:mm) | Begin van het stilte-urenvenster (lokale apparaattijd). Meldingen worden tijdens dit venster onderdrukt. |
| `notifications.quietHours.end`   | string (HH:mm) | Einde van het stilte-urenvenster.                                                                 |
| `notifications.rateLimit`        | number         | Maximaal aantal doorgestuurde meldingen per pakket per minuut. Overtollige meldingen worden verwijderd. |

De meldingenkiezer gebruikt ook veiliger gedrag voor doorgestuurde meldingevents, waardoor onbedoeld doorsturen van gevoelige systeemmeldingen wordt voorkomen.

Voorbeeldconfiguratie:

```json5
{
  notifications: {
    allowPackages: ["com.slack", "com.whatsapp"],
    denyPackages: ["com.android.systemui"],
    quietHours: {
      start: "22:00",
      end: "07:00",
    },
    rateLimit: 5,
  },
}
```

<Note>
Voor het doorsturen van meldingen is de Android-machtiging Notification Listener vereist. De app vraagt hier tijdens de installatie om.
</Note>

## Gerelateerd

- [iOS-app](/nl/platforms/ios)
- [Nodes](/nl/nodes)
- [Probleemoplossing voor Android-node](/nl/nodes/troubleshooting)
