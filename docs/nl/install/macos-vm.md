---
read_when:
    - Je wilt OpenClaw geïsoleerd houden van je primaire macOS-omgeving
    - Je wilt iMessage-integratie in een sandbox
    - Je wilt een resetbare macOS-omgeving die je kunt klonen
    - Je wilt lokale en gehoste macOS-VM-opties vergelijken
summary: Voer OpenClaw uit in een gesandboxte macOS-VM (lokaal of gehost) wanneer je isolatie of iMessage nodig hebt
title: macOS-VM's
x-i18n:
    generated_at: "2026-05-11T20:36:05Z"
    model: gpt-5.5
    provider: openai
    source_hash: 3502ccaee51261573764440f9e782d2512e9da0332bd15eef3a5c4a83b0c2936
    source_path: install/macos-vm.md
    workflow: 16
---

## Aanbevolen standaardoptie (meeste gebruikers)

- **Kleine Linux-VPS** voor een altijd ingeschakelde Gateway tegen lage kosten. Zie [VPS-hosting](/nl/vps).
- **Toegewijde hardware** (Mac mini of Linux-machine) als je volledige controle wilt en een **residentieel IP-adres** voor browserautomatisering. Veel sites blokkeren datacenter-IP's, dus lokaal browsen werkt vaak beter.
- **Hybride:** houd de Gateway op een goedkope VPS en verbind je Mac als een **node** wanneer je browser-/UI-automatisering nodig hebt. Zie [Nodes](/nl/nodes) en [Gateway op afstand](/nl/gateway/remote).

Gebruik een macOS-VM wanneer je specifiek macOS-only mogelijkheden nodig hebt, zoals iMessage, of strikte isolatie van je dagelijkse Mac wilt.

## macOS-VM-opties

### Lokale VM op je Apple Silicon-Mac (Lume)

Voer OpenClaw uit in een gesandboxte macOS-VM op je bestaande Apple Silicon-Mac met [Lume](https://cua.ai/docs/lume).

Dit geeft je:

- Volledige macOS-omgeving in isolatie (je host blijft schoon)
- iMessage-ondersteuning via `imsg` (het standaard lokale pad is onmogelijk op Linux/Windows)
- Direct resetten door VM's te klonen
- Geen extra hardware- of cloudkosten

### Gehoste Mac-aanbieders (cloud)

Als je macOS in de cloud wilt, werken gehoste Mac-aanbieders ook:

- [MacStadium](https://www.macstadium.com/) (gehoste Macs)
- Andere gehoste Mac-leveranciers werken ook; volg hun VM- en SSH-documentatie

Zodra je SSH-toegang tot een macOS-VM hebt, ga je verder met stap 6 hieronder.

---

## Snel pad (Lume, ervaren gebruikers)

1. Installeer Lume
2. `lume create openclaw --os macos --ipsw latest`
3. Voltooi Setup Assistant, schakel Remote Login (SSH) in
4. `lume run openclaw --no-display`
5. Log in via SSH, installeer OpenClaw, configureer kanalen
6. Klaar

---

## Wat je nodig hebt (Lume)

- Apple Silicon-Mac (M1/M2/M3/M4)
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

Docs: [Lume-installatie](https://cua.ai/docs/lume/guide/getting-started/installation)

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

## 3) Voltooi Setup Assistant

In het VNC-venster:

1. Selecteer taal en regio
2. Sla Apple ID over (of log in als je later iMessage wilt gebruiken)
3. Maak een gebruikersaccount aan (onthoud de gebruikersnaam en het wachtwoord)
4. Sla alle optionele functies over

Schakel SSH in nadat de setup is voltooid:

1. Open Systeeminstellingen → Algemeen → Delen
2. Schakel "Remote Login" in

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

Vervang `youruser` door het account dat je hebt aangemaakt en het IP-adres door het IP-adres van je VM.

---

## 6) Installeer OpenClaw

Binnen de VM:

```bash
npm install -g openclaw@latest
openclaw onboard --install-daemon
```

Volg de onboarding-prompts om je modelprovider (Anthropic, OpenAI, enz.) in te stellen.

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

Log daarna in bij WhatsApp (scan QR):

```bash
openclaw channels login
```

---

## 8) Voer de VM headless uit

Stop de VM en start opnieuw zonder display:

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

Dit is de belangrijkste functie van draaien op macOS. Gebruik [iMessage](/nl/channels/imessage) met `imsg` om Berichten aan OpenClaw toe te voegen.

Binnen de VM:

1. Log in bij Berichten.
2. Installeer `imsg`.
3. Verleen Volledige schijftoegang en Automatisering-toestemming voor het proces dat OpenClaw/`imsg` uitvoert.
4. Controleer RPC-ondersteuning met `imsg rpc --help`.

Voeg dit toe aan je OpenClaw-configuratie:

```json5
{
  channels: {
    imessage: {
      enabled: true,
      cliPath: "imsg",
      dbPath: "~/Library/Messages/chat.db",
    },
  },
}
```

Herstart de Gateway. Nu kan je agent iMessages verzenden en ontvangen.

Volledige setupdetails: [iMessage-kanaal](/nl/channels/imessage)

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

- Je Mac aangesloten te houden op stroom
- Sluimerstand uit te schakelen in Systeeminstellingen → Energiestand
- `caffeinate` te gebruiken indien nodig

Voor echt altijd ingeschakeld gebruik kun je een toegewijde Mac mini of een kleine VPS overwegen. Zie [VPS-hosting](/nl/vps).

---

## Probleemoplossing

| Probleem                 | Oplossing                                                                          |
| ------------------------ | ---------------------------------------------------------------------------------- |
| Kan niet via SSH inloggen op VM | Controleer of "Remote Login" is ingeschakeld in de Systeeminstellingen van de VM |
| VM-IP wordt niet weergegeven | Wacht tot de VM volledig is opgestart en voer `lume get openclaw` opnieuw uit    |
| Lume-opdracht niet gevonden | Voeg `~/.local/bin` toe aan je PATH                                               |
| WhatsApp-QR scant niet   | Zorg dat je bent ingelogd op de VM (niet de host) wanneer je `openclaw channels login` uitvoert |

---

## Gerelateerde docs

- [VPS-hosting](/nl/vps)
- [Nodes](/nl/nodes)
- [Gateway op afstand](/nl/gateway/remote)
- [iMessage-kanaal](/nl/channels/imessage)
- [Lume-snelstart](https://cua.ai/docs/lume/guide/getting-started/quickstart)
- [Lume CLI-referentie](https://cua.ai/docs/lume/reference/cli-reference)
- [Onbeheerde VM-setup](https://cua.ai/docs/lume/guide/fundamentals/unattended-setup) (geavanceerd)
- [Docker-sandboxing](/nl/install/docker) (alternatieve isolatieaanpak)
