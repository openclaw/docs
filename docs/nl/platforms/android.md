---
read_when:
    - De Android-node koppelen of opnieuw verbinden
    - Foutopsporing voor Gateway-detectie of authenticatie op Android
    - Pariteit van chatgeschiedenis tussen clients verifiëren
summary: 'Android-app (node): verbindingsdraaiboek + opdrachtinterface voor Connect/Chat/Voice/Canvas'
title: Android-app
x-i18n:
    generated_at: "2026-05-06T09:22:29Z"
    model: gpt-5.5
    provider: openai
    source_hash: cce53df4675e01858ced3d58142512ad096ced0ef50cd617e57b65f9cf911c05
    source_path: platforms/android.md
    workflow: 16
---

<Note>
De Android-app is nog niet publiek uitgebracht. De broncode is beschikbaar in de [OpenClaw-repository](https://github.com/openclaw/openclaw) onder `apps/android`. Je kunt deze zelf bouwen met Java 17 en de Android SDK (`./gradlew :app:assemblePlayDebug`). Zie [apps/android/README.md](https://github.com/openclaw/openclaw/blob/main/apps/android/README.md) voor bouwinstructies.
</Note>

## Ondersteuningsoverzicht

- Rol: begeleidende node-app (Android host de Gateway niet).
- Gateway vereist: ja (voer deze uit op macOS, Linux of Windows via WSL2).
- Installatie: [Aan de slag](/nl/start/getting-started) + [Koppelen](/nl/channels/pairing).
- Gateway: [Runbook](/nl/gateway) + [Configuratie](/nl/gateway/configuration).
  - Protocollen: [Gateway-protocol](/nl/gateway/protocol) (nodes + control plane).

## Systeembeheer

Systeembeheer (launchd/systemd) bevindt zich op de Gateway-host. Zie [Gateway](/nl/gateway).

## Verbindingsrunbook

Android-node-app ⇄ (mDNS/NSD + WebSocket) ⇄ **Gateway**

Android maakt rechtstreeks verbinding met de Gateway WebSocket en gebruikt apparaatkoppeling (`role: node`).

Voor Tailscale of publieke hosts vereist Android een beveiligd endpoint:

- Voorkeur: Tailscale Serve / Funnel met `https://<magicdns>` / `wss://<magicdns>`
- Ook ondersteund: elke andere `wss://` Gateway-URL met een echt TLS-endpoint
- Onversleutelde `ws://` blijft ondersteund op privé-LAN-adressen / `.local`-hosts, plus `localhost`, `127.0.0.1` en de Android-emulatorbrug (`10.0.2.2`)

### Vereisten

- Je kunt de Gateway uitvoeren op de "master"-machine.
- Android-apparaat/-emulator kan de gateway-WebSocket bereiken:
  - Zelfde LAN met mDNS/NSD, **of**
  - Zelfde Tailscale-tailnet met Wide-Area Bonjour / unicast DNS-SD (zie hieronder), **of**
  - Handmatige gateway-host/poort (fallback)
- Mobiel koppelen via tailnet/publiek gebruikt **geen** raw tailnet-IP-`ws://`-endpoints. Gebruik in plaats daarvan Tailscale Serve of een andere `wss://`-URL.
- Je kunt de CLI (`openclaw`) uitvoeren op de gateway-machine (of via SSH).

### 1) Start de Gateway

```bash
openclaw gateway --port 18789 --verbose
```

Controleer in de logs dat je iets als dit ziet:

- `listening on ws://0.0.0.0:18789`

Voor externe Android-toegang via Tailscale heeft Serve/Funnel de voorkeur boven een raw tailnet-bind:

```bash
openclaw gateway --tailscale serve
```

Dit geeft Android een beveiligd `wss://` / `https://`-endpoint. Een gewone `gateway.bind: "tailnet"`-setup is niet genoeg voor eerste externe Android-koppeling, tenzij je ook afzonderlijk TLS termineert.

### 2) Controleer discovery (optioneel)

Vanaf de gateway-machine:

```bash
dns-sd -B _openclaw-gw._tcp local.
```

Meer foutopsporingsnotities: [Bonjour](/nl/gateway/bonjour).

Als je ook een wide-area discovery-domein hebt geconfigureerd, vergelijk dan met:

```bash
openclaw gateway discover --json
```

Dat toont `local.` plus het geconfigureerde wide-area-domein in één keer en gebruikt het opgeloste service-endpoint in plaats van alleen TXT-hints.

#### Tailnet-discovery (Wenen ⇄ Londen) via unicast DNS-SD

Android NSD/mDNS-discovery werkt niet over netwerken heen. Als je Android-node en de gateway op verschillende netwerken zitten maar via Tailscale zijn verbonden, gebruik dan in plaats daarvan Wide-Area Bonjour / unicast DNS-SD.

Discovery alleen is niet voldoende voor tailnet/publieke Android-koppeling. De gevonden route heeft nog steeds een beveiligd endpoint nodig (`wss://` of Tailscale Serve):

1. Stel een DNS-SD-zone in (bijvoorbeeld `openclaw.internal.`) op de gateway-host en publiceer `_openclaw-gw._tcp`-records.
2. Configureer Tailscale split DNS voor je gekozen domein en laat dit naar die DNS-server wijzen.

Details en voorbeeldconfiguratie voor CoreDNS: [Bonjour](/nl/gateway/bonjour).

### 3) Maak verbinding vanaf Android

In de Android-app:

- De app houdt de gateway-verbinding actief via een **voorgrondservice** (blijvende melding).
- Open het tabblad **Verbinden**.
- Gebruik de modus **Setupcode** of **Handmatig**.
- Als discovery is geblokkeerd, gebruik dan handmatige host/poort in **Geavanceerde bediening**. Voor privé-LAN-hosts werkt `ws://` nog steeds. Voor Tailscale/publieke hosts schakel je TLS in en gebruik je een `wss://` / Tailscale Serve-endpoint.

Na de eerste geslaagde koppeling maakt Android bij het starten automatisch opnieuw verbinding:

- Handmatig endpoint (indien ingeschakeld), anders
- De laatst gevonden gateway (best-effort).

### Aanwezigheidsbeacons

Nadat de geauthenticeerde node-sessie verbinding maakt, en wanneer de app naar de achtergrond gaat terwijl de
voorgrondservice nog verbonden is, roept Android `node.event` aan met
`event: "node.presence.alive"`. De gateway registreert dit alleen als `lastSeenAtMs`/`lastSeenReason` in de
metadata van de gekoppelde node/het gekoppelde apparaat nadat de geauthenticeerde node-apparaatidentiteit bekend is.

De app telt de beacon alleen als succesvol geregistreerd wanneer de gateway-respons
`handled: true` bevat. Oudere gateways kunnen `node.event` bevestigen met `{ "ok": true }`; die respons is
compatibel, maar telt niet als een duurzame laatst-gezien-update.

### 4) Keur koppeling goed (CLI)

Op de gateway-machine:

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw devices reject <requestId>
```

Koppelingsdetails: [Koppelen](/nl/channels/pairing).

Optioneel: als de Android-node altijd verbinding maakt vanaf een strikt gecontroleerd subnet,
kun je je aanmelden voor automatische goedkeuring bij eerste node-koppeling met expliciete CIDR's of exacte IP's:

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

Dit is standaard uitgeschakeld. Het is alleen van toepassing op nieuwe `role: node`-koppeling zonder
aangevraagde scopes. Operator-/browserkoppeling en elke wijziging in rol, scope, metadata of
publieke sleutel vereist nog steeds handmatige goedkeuring.

### 5) Controleer of de node is verbonden

- Via nodestatus:

  ```bash
  openclaw nodes status
  ```

- Via Gateway:

  ```bash
  openclaw gateway call node.list --params "{}"
  ```

### 6) Chat + geschiedenis

Het Android-tabblad Chat ondersteunt sessieselectie (standaard `main`, plus andere bestaande sessies):

- Geschiedenis: `chat.history` (genormaliseerd voor weergave; inline directive-tags worden
  uit zichtbare tekst verwijderd, XML-payloads voor plain-text tool-calls (waaronder
  `<tool_call>...</tool_call>`, `<function_call>...</function_call>`,
  `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>` en
  afgekorte tool-call-blokken) en gelekte ASCII-/full-width model-controltokens
  worden verwijderd, pure stille-token-assistant-rijen zoals exact `NO_REPLY` /
  `no_reply` worden weggelaten, en te grote rijen kunnen worden vervangen door placeholders)
- Verzenden: `chat.send`
- Push-updates (best-effort): `chat.subscribe` → `event:"chat"`

### 7) Canvas + camera

#### Gateway Canvas Host (aanbevolen voor webcontent)

Als je wilt dat de node echte HTML/CSS/JS toont die de agent op schijf kan bewerken, wijs de node dan naar de Gateway canvas host.

<Note>
Nodes laden canvas vanaf de Gateway HTTP-server (dezelfde poort als `gateway.port`, standaard `18789`).
</Note>

1. Maak `~/.openclaw/workspace/canvas/index.html` aan op de gateway-host.

2. Navigeer de node ernaartoe (LAN):

```bash
openclaw nodes invoke --node "<Android Node>" --command canvas.navigate --params '{"url":"http://<gateway-hostname>.local:18789/__openclaw__/canvas/"}'
```

Tailnet (optioneel): als beide apparaten op Tailscale zitten, gebruik dan een MagicDNS-naam of tailnet-IP in plaats van `.local`, bijvoorbeeld `http://<gateway-magicdns>:18789/__openclaw__/canvas/`.

Deze server injecteert een live-reload-client in HTML en herlaadt bij bestandswijzigingen.
De A2UI-host bevindt zich op `http://<gateway-host>:18789/__openclaw__/a2ui/`.

Canvas-commando's (alleen voorgrond):

- `canvas.eval`, `canvas.snapshot`, `canvas.navigate` (gebruik `{"url":""}` of `{"url":"/"}` om terug te keren naar de standaardscaffold). `canvas.snapshot` retourneert `{ format, base64 }` (standaard `format="jpeg"`).
- A2UI: `canvas.a2ui.push`, `canvas.a2ui.reset` (`canvas.a2ui.pushJSONL` legacy-alias)

Camera-commando's (alleen voorgrond; met toestemmingscontrole):

- `camera.snap` (jpg)
- `camera.clip` (mp4)

Zie [Cameranode](/nl/nodes/camera) voor parameters en CLI-helpers.

### 8) Spraak + uitgebreid Android-commando-oppervlak

- Spraaktabblad: Android heeft twee expliciete opnamemodi. **Mic** is een handmatige sessie op het spraaktabblad die elke pauze als chatbeurt verzendt en stopt wanneer de app de voorgrond verlaat of de gebruiker het spraaktabblad verlaat. **Talk** is doorlopende Talk Mode en blijft luisteren totdat deze wordt uitgeschakeld of de node de verbinding verbreekt.
- Talk Mode promoveert de bestaande voorgrondservice van `dataSync` naar `dataSync|microphone` voordat opname start, en degradeert deze weer wanneer Talk Mode stopt. Android 14+ vereist de `FOREGROUND_SERVICE_MICROPHONE`-declaratie, de runtime-toestemming `RECORD_AUDIO` en het microfoonservicetype tijdens runtime.
- Gesproken antwoorden gebruiken `talk.speak` via de geconfigureerde Gateway Talk-provider. Lokale systeem-TTS wordt alleen gebruikt wanneer `talk.speak` niet beschikbaar is.
- Voice wake blijft uitgeschakeld in de Android-UX/runtime.
- Aanvullende Android-commandofamilies (beschikbaarheid hangt af van apparaat + toestemmingen):
  - `device.status`, `device.info`, `device.permissions`, `device.health`
  - `notifications.list`, `notifications.actions` (zie [Meldingen doorsturen](#notification-forwarding) hieronder)
  - `photos.latest`
  - `contacts.search`, `contacts.add`
  - `calendar.events`, `calendar.add`
  - `callLog.search`
  - `sms.search`
  - `motion.activity`, `motion.pedometer`

## Assistant-entrypoints

Android ondersteunt het starten van OpenClaw via de systeemassistenttrigger (Google
Assistant). Wanneer dit is geconfigureerd, opent het ingedrukt houden van de homeknop of het zeggen van "Hey Google, ask
OpenClaw..." de app en geeft de prompt door aan de chatcomposer.

Dit gebruikt Android **App Actions**-metadata die in het appmanifest is gedeclareerd. Er is
geen extra configuratie nodig aan de gatewaykant -- de assistant-intent wordt
volledig door de Android-app afgehandeld en als normaal chatbericht doorgestuurd.

<Note>
Beschikbaarheid van App Actions hangt af van het apparaat, de versie van Google Play Services
en of de gebruiker OpenClaw heeft ingesteld als standaardassistent-app.
</Note>

## Meldingen doorsturen

Android kan apparaatmeldingen als events doorsturen naar de gateway. Met verschillende instellingen kun je bepalen welke meldingen worden doorgestuurd en wanneer.

| Sleutel                          | Type           | Beschrijving                                                                                       |
| -------------------------------- | -------------- | -------------------------------------------------------------------------------------------------- |
| `notifications.allowPackages`    | string[]       | Stuur alleen meldingen van deze pakketnamen door. Indien ingesteld, worden alle andere pakketten genegeerd. |
| `notifications.denyPackages`     | string[]       | Stuur nooit meldingen van deze pakketnamen door. Toegepast na `allowPackages`.                      |
| `notifications.quietHours.start` | string (HH:mm) | Begin van het stille-urenvenster (lokale apparaattijd). Meldingen worden tijdens dit venster onderdrukt. |
| `notifications.quietHours.end`   | string (HH:mm) | Einde van het stille-urenvenster.                                                                  |
| `notifications.rateLimit`        | number         | Maximumaantal doorgestuurde meldingen per pakket per minuut. Overtollige meldingen worden verwijderd. |

De meldingenkiezer gebruikt ook veiliger gedrag voor doorgestuurde meldingsevents, waardoor onbedoeld doorsturen van gevoelige systeemmeldingen wordt voorkomen.

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
Meldingen doorsturen vereist de Android-toestemming Notification Listener. De app vraagt hierom tijdens de setup.
</Note>

## Gerelateerd

- [iOS-app](/nl/platforms/ios)
- [Nodes](/nl/nodes)
- [Problemen met Android-nodes oplossen](/nl/nodes/troubleshooting)
