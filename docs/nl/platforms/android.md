---
read_when:
    - Android-Node koppelen of opnieuw verbinden
    - Android Gateway-detectie of -authenticatie debuggen
    - Pariteit van chatgeschiedenis tussen clients verifiëren
summary: 'Android-app (node): verbindingsrunbook + opdrachtinterface voor Connect/Chat/Voice/Canvas'
title: Android-app
x-i18n:
    generated_at: "2026-04-29T22:58:33Z"
    model: gpt-5.5
    provider: openai
    source_hash: ae8bec406a006165f124f305e00c848f5527d43dba3cbcd07bd0d7e6f0dcc247
    source_path: platforms/android.md
    workflow: 16
---

<Note>
De Android-app is nog niet openbaar uitgebracht. De broncode is beschikbaar in de [OpenClaw-repository](https://github.com/openclaw/openclaw) onder `apps/android`. Je kunt deze zelf bouwen met Java 17 en de Android SDK (`./gradlew :app:assemblePlayDebug`). Zie [apps/android/README.md](https://github.com/openclaw/openclaw/blob/main/apps/android/README.md) voor buildinstructies.
</Note>

## Ondersteuningssnapshot

- Rol: begeleidende Node-app (Android host de Gateway niet).
- Gateway vereist: ja (voer deze uit op macOS, Linux of Windows via WSL2).
- Installatie: [Aan de slag](/nl/start/getting-started) + [Koppelen](/nl/channels/pairing).
- Gateway: [Runbook](/nl/gateway) + [Configuratie](/nl/gateway/configuration).
  - Protocollen: [Gateway-protocol](/nl/gateway/protocol) (Nodes + control plane).

## Systeembeheer

Systeembeheer (launchd/systemd) bevindt zich op de Gateway-host. Zie [Gateway](/nl/gateway).

## Verbindingsrunbook

Android-Node-app ⇄ (mDNS/NSD + WebSocket) ⇄ **Gateway**

Android maakt rechtstreeks verbinding met de Gateway-WebSocket en gebruikt apparaatkoppeling (`role: node`).

Voor Tailscale of openbare hosts vereist Android een beveiligd endpoint:

- Voorkeur: Tailscale Serve / Funnel met `https://<magicdns>` / `wss://<magicdns>`
- Ook ondersteund: elke andere `wss://` Gateway-URL met een echt TLS-endpoint
- Cleartext `ws://` blijft ondersteund op privé-LAN-adressen / `.local`-hosts, plus `localhost`, `127.0.0.1` en de Android-emulatorbrug (`10.0.2.2`)

### Vereisten

- Je kunt de Gateway uitvoeren op de “master”-machine.
- Android-apparaat/emulator kan de Gateway-WebSocket bereiken:
  - Zelfde LAN met mDNS/NSD, **of**
  - Zelfde Tailscale-tailnet met Wide-Area Bonjour / unicast DNS-SD (zie hieronder), **of**
  - Handmatige Gateway-host/poort (fallback)
- Mobiele koppeling via tailnet/openbaar gebruikt **geen** ruwe tailnet-IP-`ws://`-endpoints. Gebruik in plaats daarvan Tailscale Serve of een andere `wss://`-URL.
- Je kunt de CLI (`openclaw`) uitvoeren op de Gateway-machine (of via SSH).

### 1) Start de Gateway

```bash
openclaw gateway --port 18789 --verbose
```

Controleer in de logs dat je iets ziet zoals:

- `listening on ws://0.0.0.0:18789`

Voor externe Android-toegang via Tailscale geef je de voorkeur aan Serve/Funnel in plaats van een ruwe tailnet-bind:

```bash
openclaw gateway --tailscale serve
```

Dit geeft Android een beveiligd `wss://`- / `https://`-endpoint. Een eenvoudige `gateway.bind: "tailnet"`-configuratie is niet genoeg voor eerste externe Android-koppeling, tenzij je TLS ook afzonderlijk termineert.

### 2) Controleer discovery (optioneel)

Vanaf de Gateway-machine:

```bash
dns-sd -B _openclaw-gw._tcp local.
```

Meer debuggingnotities: [Bonjour](/nl/gateway/bonjour).

Als je ook een wide-area discovery-domein hebt geconfigureerd, vergelijk dan met:

```bash
openclaw gateway discover --json
```

Dat toont `local.` plus het geconfigureerde wide-area domein in één stap en gebruikt het opgeloste service-endpoint in plaats van alleen TXT-hints.

#### Tailnet-discovery (Wenen ⇄ Londen) via unicast DNS-SD

Android NSD/mDNS-discovery gaat niet over netwerkgrenzen heen. Als je Android-Node en de Gateway zich op verschillende netwerken bevinden maar verbonden zijn via Tailscale, gebruik dan in plaats daarvan Wide-Area Bonjour / unicast DNS-SD.

Discovery alleen is niet voldoende voor Android-koppeling via tailnet/openbaar. De gevonden route heeft nog steeds een beveiligd endpoint nodig (`wss://` of Tailscale Serve):

1. Stel een DNS-SD-zone in (voorbeeld `openclaw.internal.`) op de Gateway-host en publiceer `_openclaw-gw._tcp`-records.
2. Configureer Tailscale split DNS voor je gekozen domein dat naar die DNS-server wijst.

Details en voorbeeldconfiguratie voor CoreDNS: [Bonjour](/nl/gateway/bonjour).

### 3) Verbinden vanaf Android

In de Android-app:

- De app houdt de Gateway-verbinding actief via een **foreground service** (blijvende melding).
- Open het tabblad **Verbinden**.
- Gebruik de modus **Setupcode** of **Handmatig**.
- Als discovery is geblokkeerd, gebruik dan handmatige host/poort in **Geavanceerde bediening**. Voor privé-LAN-hosts werkt `ws://` nog steeds. Voor Tailscale/openbare hosts schakel je TLS in en gebruik je een `wss://`- / Tailscale Serve-endpoint.

Na de eerste succesvolle koppeling maakt Android automatisch opnieuw verbinding bij het starten:

- Handmatig endpoint (indien ingeschakeld), anders
- De laatst gevonden Gateway (best-effort).

### Aanwezigheidsalive-beacons

Nadat de geauthenticeerde Node-sessie verbinding maakt, en wanneer de app naar de achtergrond gaat terwijl de foreground service nog steeds verbonden is, roept Android `node.event` aan met `event: "node.presence.alive"`. De Gateway registreert dit als `lastSeenAtMs`/`lastSeenReason` op de gekoppelde Node-/apparaatmetadata, maar pas nadat de geauthenticeerde Node-apparaatidentiteit bekend is.

De app telt de beacon alleen als succesvol geregistreerd wanneer het Gateway-antwoord `handled: true` bevat. Oudere Gateways kunnen `node.event` bevestigen met `{ "ok": true }`; dat antwoord is compatibel maar telt niet als duurzame last-seen-update.

### 4) Koppeling goedkeuren (CLI)

Op de Gateway-machine:

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw devices reject <requestId>
```

Koppelingsdetails: [Koppelen](/nl/channels/pairing).

Optioneel: als de Android-Node altijd verbinding maakt vanaf een strikt gecontroleerd subnet, kun je expliciete CIDR's of exacte IP's gebruiken voor automatische goedkeuring van eerste Node-koppeling:

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

Dit is standaard uitgeschakeld. Het geldt alleen voor nieuwe `role: node`-koppeling zonder aangevraagde scopes. Operator-/browserkoppeling en elke wijziging in rol, scope, metadata of publieke sleutel vereist nog steeds handmatige goedkeuring.

### 5) Controleer of de Node is verbonden

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

- Geschiedenis: `chat.history` (weergavegenormaliseerd; inline directivetags worden uit zichtbare tekst gestript, plaintext XML-payloads voor toolcalls (waaronder `<tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>` en afgekapt toolcall-blokken) en gelekte ASCII-/full-width modelcontroletokens worden gestript, pure silent-token-assistentrijen zoals exact `NO_REPLY` / `no_reply` worden weggelaten, en te grote rijen kunnen worden vervangen door placeholders)
- Verzenden: `chat.send`
- Pushupdates (best-effort): `chat.subscribe` → `event:"chat"`

### 7) Canvas + camera

#### Gateway Canvas Host (aanbevolen voor webinhoud)

Als je wilt dat de Node echte HTML/CSS/JS toont die de agent op schijf kan bewerken, wijs de Node dan naar de Gateway canvas host.

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
De A2UI-host bevindt zich op `http://<gateway-host>:18789/__openclaw__/a2ui/`.

Canvas-commando's (alleen foreground):

- `canvas.eval`, `canvas.snapshot`, `canvas.navigate` (gebruik `{"url":""}` of `{"url":"/"}` om terug te keren naar de standaard scaffold). `canvas.snapshot` retourneert `{ format, base64 }` (standaard `format="jpeg"`).
- A2UI: `canvas.a2ui.push`, `canvas.a2ui.reset` (`canvas.a2ui.pushJSONL` legacy alias)

Camera-commando's (alleen foreground; achter permissie):

- `camera.snap` (jpg)
- `camera.clip` (mp4)

Zie [Camera-Node](/nl/nodes/camera) voor parameters en CLI-helpers.

### 8) Spraak + uitgebreid Android-commandosurface

- Spraaktabblad: Android heeft twee expliciete opnamemodi. **Mic** is een handmatige sessie op het spraaktabblad die elke pauze als chatbeurt verzendt en stopt wanneer de app de foreground verlaat of de gebruiker het spraaktabblad verlaat. **Talk** is continue Talk Mode en blijft luisteren totdat deze wordt uitgeschakeld of de Node de verbinding verbreekt.
- Talk Mode promoveert de bestaande foreground service van `dataSync` naar `dataSync|microphone` voordat opname begint, en degradeert deze weer wanneer Talk Mode stopt. Android 14+ vereist de `FOREGROUND_SERVICE_MICROPHONE`-declaratie, de runtime-toekenning `RECORD_AUDIO` en het microfoonservicetype tijdens runtime.
- Gesproken antwoorden gebruiken `talk.speak` via de geconfigureerde Gateway Talk-provider. Lokale systeem-TTS wordt alleen gebruikt wanneer `talk.speak` niet beschikbaar is.
- Voice wake blijft uitgeschakeld in de Android-UX/runtime.
- Extra Android-commandofamilies (beschikbaarheid hangt af van apparaat + permissies):
  - `device.status`, `device.info`, `device.permissions`, `device.health`
  - `notifications.list`, `notifications.actions` (zie [Meldingen doorsturen](#notification-forwarding) hieronder)
  - `photos.latest`
  - `contacts.search`, `contacts.add`
  - `calendar.events`, `calendar.add`
  - `callLog.search`
  - `sms.search`
  - `motion.activity`, `motion.pedometer`

## Assistent-entrypoints

Android ondersteunt het starten van OpenClaw via de systeemassistent-trigger (Google Assistant). Wanneer dit is geconfigureerd, opent het ingedrukt houden van de homeknop of het zeggen van "Hey Google, ask OpenClaw..." de app en geeft de prompt door aan de chatcomposer.

Dit gebruikt Android **App Actions**-metadata die in het appmanifest is gedeclareerd. Er is geen extra configuratie nodig aan de Gateway-kant -- de assistent-intent wordt volledig door de Android-app afgehandeld en doorgestuurd als een normaal chatbericht.

<Note>
De beschikbaarheid van App Actions hangt af van het apparaat, de versie van Google Play Services en of de gebruiker OpenClaw als standaardassistent-app heeft ingesteld.
</Note>

## Meldingen doorsturen

Android kan apparaatmeldingen als events doorsturen naar de Gateway. Met verschillende instellingen kun je bepalen welke meldingen worden doorgestuurd en wanneer.

| Sleutel                          | Type           | Beschrijving                                                                                              |
| -------------------------------- | -------------- | --------------------------------------------------------------------------------------------------------- |
| `notifications.allowPackages`    | string[]       | Stuur alleen meldingen van deze pakketnamen door. Als dit is ingesteld, worden alle andere pakketten genegeerd. |
| `notifications.denyPackages`     | string[]       | Stuur nooit meldingen van deze pakketnamen door. Toegepast na `allowPackages`.                            |
| `notifications.quietHours.start` | string (HH:mm) | Begin van het venster voor stille uren (lokale apparaattijd). Meldingen worden tijdens dit venster onderdrukt. |
| `notifications.quietHours.end`   | string (HH:mm) | Einde van het venster voor stille uren.                                                                   |
| `notifications.rateLimit`        | number         | Maximum aantal doorgestuurde meldingen per pakket per minuut. Overtollige meldingen worden gedropt.      |

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
Voor het doorsturen van meldingen is de Android Notification Listener-permissie vereist. De app vraagt hier tijdens de setup om.
</Note>

## Gerelateerd

- [iOS-app](/nl/platforms/ios)
- [Nodes](/nl/nodes)
- [Problemen met Android-Node oplossen](/nl/nodes/troubleshooting)
