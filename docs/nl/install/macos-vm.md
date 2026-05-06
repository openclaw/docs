---
read_when:
    - Je wilt OpenClaw geïsoleerd houden van je primaire macOS-omgeving
    - Je wilt iMessage-integratie (BlueBubbles) in een sandbox
    - U wilt een resetbare macOS-omgeving die u kunt klonen
    - Je wilt lokale versus gehoste macOS-VM-opties vergelijken
summary: Voer OpenClaw uit in een gesandboxte macOS-VM (lokaal of gehost) wanneer je isolatie of iMessage nodig hebt
title: macOS-VM's
x-i18n:
    generated_at: "2026-05-06T09:20:14Z"
    model: gpt-5.5
    provider: openai
    source_hash: e2b6841f66e63606346f364bb1b1b9ca4a3d52558e3d8c6f129c5b89387c6968
    source_path: install/macos-vm.md
    workflow: 16
---

## Aanbevolen standaardkeuze (meeste gebruikers)

- **Kleine Linux-VPS** voor een altijd actieve Gateway en lage kosten. Zie [VPS-hosting](/nl/vps).
- **Eigen hardware** (Mac mini of Linux-machine) als je volledige controle en een **residentieel IP-adres** wilt voor browserautomatisering. Veel sites blokkeren datacenter-IP's, dus lokaal browsen werkt vaak beter.
- **Hybride:** houd de Gateway op een goedkope VPS en verbind je Mac als een **Node** wanneer je browser-/UI-automatisering nodig hebt. Zie [Nodes](/nl/nodes) en [Gateway op afstand](/nl/gateway/remote).

Gebruik een macOS-VM wanneer je specifiek macOS-only mogelijkheden nodig hebt (iMessage/BlueBubbles) of strikte isolatie van je dagelijkse Mac wilt.

## macOS-VM-opties

### Lokale VM op je Apple Silicon Mac (Lume)

Voer OpenClaw uit in een sandboxed macOS-VM op je bestaande Apple Silicon Mac met [Lume](https://cua.ai/docs/lume).

Dit geeft je:

- Volledige macOS-omgeving in isolatie (je host blijft schoon)
- iMessage-ondersteuning via BlueBubbles (onmogelijk op Linux/Windows)
- Directe reset door VM's te klonen
- Geen extra hardware- of cloudkosten

### Gehoste Mac-aanbieders (cloud)

Als je macOS in de cloud wilt, werken gehoste Mac-aanbieders ook:

- [MacStadium](https://www.macstadium.com/) (gehoste Macs)
- Andere gehoste Mac-leveranciers werken ook; volg hun VM- en SSH-documentatie

Zodra je SSH-toegang hebt tot een macOS-VM, ga je verder bij stap 6 hieronder.

---

## Snel pad (Lume, ervaren gebruikers)

1. Installeer Lume
2. `lume create openclaw --os macos --ipsw latest`
3. Voltooi de configuratie-assistent, schakel extern inloggen in (SSH)
4. `lume run openclaw --no-display`
5. Log in via SSH, installeer OpenClaw, configureer kanalen
6. Klaar

---

## Wat je nodig hebt (Lume)

- Apple Silicon Mac (M1/M2/M3/M4)
- macOS Sequoia of later op de host
- ~60 GB vrije schijfruimte per VM
- ~20 minuten

---

## 1) Installeer Lume

```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/trycua/cua/main/libs/lume/scripts/install.sh)"
```

Als `~/.local/bin` niet in je PATH staat:

```bash
echo 'export PATH="$PATH:$HOME/.local/bin"' >> ~/.zshrc && source ~/.zshrc
```

Controleer:

```bash
lume --version
```

Documentatie: [Lume-installatie](https://cua.ai/docs/lume/guide/getting-started/installation)

---

## 2) Maak de macOS-VM

```bash
lume create openclaw --os macos --ipsw latest
```

Dit downloadt macOS en maakt de VM. Er wordt automatisch een VNC-venster geopend.

<Note>
De download kan even duren, afhankelijk van je verbinding.
</Note>

---

## 3) Voltooi de configuratie-assistent

In het VNC-venster:

1. Selecteer taal en regio
2. Sla Apple ID over (of log in als je later iMessage wilt)
3. Maak een gebruikersaccount aan (onthoud de gebruikersnaam en het wachtwoord)
4. Sla alle optionele functies over

Nadat de installatie is voltooid, schakel je SSH in:

1. Open Systeeminstellingen → Algemeen → Delen
2. Schakel "Extern inloggen" in

---

## 4) Haal het IP-adres van de VM op

```bash
lume get openclaw
```

Zoek het IP-adres (meestal `192.168.64.x`).

---

## 5) Log via SSH in op de VM

```bash
ssh youruser@192.168.64.X
```

Vervang `youruser` door het account dat je hebt aangemaakt, en het IP-adres door het IP-adres van je VM.

---

## 6) Installeer OpenClaw

Binnen de VM:

```bash
npm install -g openclaw@latest
openclaw onboard --install-daemon
```

Volg de onboardingprompts om je modelprovider in te stellen (Anthropic, OpenAI, enz.).

---

## 7) Configureer kanalen

Bewerk het configuratiebestand:

```bash
nano ~/.openclaw/openclaw.json
```

Voeg je kanalen toe:

```json5
{
  channels: {
    whatsapp: {
      dmPolicy: "allowlist",
      allowFrom: ["+15551234567"],
    },
    telegram: {
      botToken: "YOUR_BOT_TOKEN",
    },
  },
}
```

Log daarna in op WhatsApp (QR scannen):

```bash
openclaw channels login
```

---

## 8) Voer de VM headless uit

Stop de VM en herstart zonder scherm:

```bash
lume stop openclaw
lume run openclaw --no-display
```

De VM draait op de achtergrond. De daemon van OpenClaw houdt de Gateway actief.

Status controleren:

```bash
ssh youruser@192.168.64.X "openclaw status"
```

---

## Bonus: iMessage-integratie

Dit is de killer feature van draaien op macOS. Gebruik [BlueBubbles](https://bluebubbles.app) om iMessage aan OpenClaw toe te voegen.

Binnen de VM:

1. Download BlueBubbles van bluebubbles.app
2. Log in met je Apple ID
3. Schakel de Web API in en stel een wachtwoord in
4. Richt BlueBubbles-webhooks op je Gateway (voorbeeld: `https://your-gateway-host:3000/bluebubbles-webhook?password=<password>`)

Voeg dit toe aan je OpenClaw-configuratie:

```json5
{
  channels: {
    bluebubbles: {
      serverUrl: "http://localhost:1234",
      password: "your-api-password",
      webhookPath: "/bluebubbles-webhook",
    },
  },
}
```

Herstart de Gateway. Je agent kan nu iMessages verzenden en ontvangen.

Volledige installatiedetails: [BlueBubbles-kanaal](/nl/channels/bluebubbles)

---

## Sla een gouden image op

Maak een snapshot van je schone staat voordat je verder aanpast:

```bash
lume stop openclaw
lume clone openclaw openclaw-golden
```

Altijd resetten:

```bash
lume stop openclaw && lume delete openclaw
lume clone openclaw-golden openclaw
lume run openclaw --no-display
```

---

## 24/7 draaien

Houd de VM actief door:

- Je Mac aangesloten op stroom te houden
- Sluimerstand uit te schakelen in Systeeminstellingen → Energiestand
- `caffeinate` te gebruiken indien nodig

Voor echt altijd actief gebruik kun je een eigen Mac mini of een kleine VPS overwegen. Zie [VPS-hosting](/nl/vps).

---

## Probleemoplossing

| Probleem                 | Oplossing                                                                          |
| ------------------------ | ---------------------------------------------------------------------------------- |
| Kan niet via SSH inloggen op de VM | Controleer of "Extern inloggen" is ingeschakeld in de Systeeminstellingen van de VM |
| VM-IP wordt niet getoond | Wacht tot de VM volledig is opgestart, voer `lume get openclaw` opnieuw uit        |
| Lume-opdracht niet gevonden | Voeg `~/.local/bin` toe aan je PATH                                                |
| WhatsApp-QR scant niet   | Zorg dat je bent ingelogd op de VM (niet op de host) wanneer je `openclaw channels login` uitvoert |

---

## Gerelateerde documentatie

- [VPS-hosting](/nl/vps)
- [Nodes](/nl/nodes)
- [Gateway op afstand](/nl/gateway/remote)
- [BlueBubbles-kanaal](/nl/channels/bluebubbles)
- [Lume Quickstart](https://cua.ai/docs/lume/guide/getting-started/quickstart)
- [Lume CLI-referentie](https://cua.ai/docs/lume/reference/cli-reference)
- [Onbeheerde VM-installatie](https://cua.ai/docs/lume/guide/fundamentals/unattended-setup) (geavanceerd)
- [Docker-sandboxing](/nl/install/docker) (alternatieve isolatieaanpak)
