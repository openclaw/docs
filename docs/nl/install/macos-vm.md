---
read_when:
    - Je wilt OpenClaw isoleren van je hoofd-macOS-omgeving
    - Je wilt iMessage-integratie in een sandbox
    - U wilt een resetbare macOS-omgeving die u kunt klonen
    - Je wilt lokale versus gehoste macOS-VM-opties vergelijken
summary: Voer OpenClaw uit in een sandboxed macOS-VM (lokaal of gehost) wanneer je isolatie of iMessage nodig hebt
title: macOS-VM's
x-i18n:
    generated_at: "2026-06-27T17:42:54Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: aee2fa0651b711f29d7d092da931bd924bc8ce8a5ca389cf8f189725fa586f3f
    source_path: install/macos-vm.md
    workflow: 16
---

## Aanbevolen standaardoptie (de meeste gebruikers)

- **Kleine Linux-VPS** voor een altijd actieve Gateway en lage kosten. Zie [VPS-hosting](/nl/vps).
- **Toegewijde hardware** (Mac mini of Linux-machine) als je volledige controle en een **residentieel IP-adres** wilt voor browserautomatisering. Veel sites blokkeren datacenter-IP's, dus lokaal browsen werkt vaak beter.
- **Hybride:** houd de Gateway op een goedkope VPS en verbind je Mac als **node** wanneer je browser-/UI-automatisering nodig hebt. Zie [Nodes](/nl/nodes) en [Gateway remote](/nl/gateway/remote).

Gebruik een macOS-VM wanneer je specifiek macOS-only mogelijkheden nodig hebt, zoals iMessage, of strikte isolatie van je dagelijkse Mac wilt.

## macOS-VM-opties

### Lokale VM op je Apple Silicon Mac (Lume)

Voer OpenClaw uit in een sandboxed macOS-VM op je bestaande Apple Silicon Mac met [Lume](https://cua.ai/docs/lume).

Dit geeft je:

- Volledige macOS-omgeving in isolatie (je host blijft schoon)
- iMessage-ondersteuning via `imsg` (het standaard lokale pad is onmogelijk op Linux/Windows)
- Direct resetten door VM's te klonen
- Geen extra hardware- of cloudkosten

### Gehoste Mac-aanbieders (cloud)

Als je macOS in de cloud wilt, werken gehoste Mac-aanbieders ook:

- [MacStadium](https://www.macstadium.com/) (gehoste Macs)
- Andere gehoste Mac-leveranciers werken ook; volg hun VM- en SSH-documentatie

Zodra je SSH-toegang hebt tot een macOS-VM, ga je verder met stap 6 hieronder.

---

## Snel pad (Lume, ervaren gebruikers)

1. Installeer Lume
2. `lume create openclaw --os macos --ipsw latest`
3. Voltooi Setup Assistant, schakel Remote Login (SSH) in
4. `lume run openclaw --no-display`
5. SSH naar binnen, installeer OpenClaw, configureer kanalen
6. Klaar

---

## Wat je nodig hebt (Lume)

- Apple Silicon Mac (M1/M2/M3/M4)
- macOS Sequoia of nieuwer op de host
- ~60 GB vrije schijfruimte per VM
- ~20 minuten

---

## 1) Lume installeren

```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/trycua/cua/main/libs/lume/scripts/install.sh)"
```

Als `~/.local/bin` niet in je PATH staat:

```bash
echo 'export PATH="$PATH:$HOME/.local/bin"' >> ~/.zshrc && source ~/.zshrc
```

Verifieer:

```bash
lume --version
```

Documentatie: [Lume-installatie](https://cua.ai/docs/lume/guide/getting-started/installation)

---

## 2) De macOS-VM maken

```bash
lume create openclaw --os macos --ipsw latest
```

Dit downloadt macOS en maakt de VM. Er wordt automatisch een VNC-venster geopend.

<Note>
Het downloaden kan even duren, afhankelijk van je verbinding.
</Note>

---

## 3) Setup Assistant voltooien

In het VNC-venster:

1. Selecteer taal en regio
2. Sla Apple ID over (of log in als je later iMessage wilt)
3. Maak een gebruikersaccount aan (onthoud de gebruikersnaam en het wachtwoord)
4. Sla alle optionele functies over

Nadat de setup is voltooid:

1. Schakel SSH in: open Systeeminstellingen -> Algemeen -> Delen en schakel "Remote Login" in.
2. Schakel automatisch inloggen in voor headless VM-gebruik: open Systeeminstellingen -> Gebruikers en groepen, selecteer "Automatisch inloggen als:" en kies de VM-gebruiker.

---

## 4) Het IP-adres van de VM ophalen

```bash
lume get openclaw
```

Zoek naar het IP-adres (meestal `192.168.64.x`).

---

## 5) Via SSH verbinden met de VM

```bash
ssh youruser@192.168.64.X
```

Vervang `youruser` door het account dat je hebt gemaakt en het IP-adres door het IP-adres van je VM.

---

## 6) OpenClaw installeren

Binnen de VM:

```bash
npm install -g openclaw@latest
openclaw onboard --install-daemon
```

Volg de onboarding-prompts om je modelprovider (Anthropic, OpenAI, enz.) in te stellen.

---

## 7) Kanalen configureren

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

## 8) De VM headless uitvoeren

Stop de VM en start opnieuw zonder beeldscherm:

```bash
lume stop openclaw
lume run openclaw --no-display
```

De VM draait op de achtergrond. De daemon van OpenClaw houdt de gateway actief.

Status controleren:

```bash
ssh youruser@192.168.64.X "openclaw status"
```

---

## Bonus: iMessage-integratie

Dit is de killer feature van draaien op macOS. Gebruik [iMessage](/nl/channels/imessage) met `imsg` om Berichten toe te voegen aan OpenClaw.

Binnen de VM:

1. Log in bij Berichten.
2. Installeer `imsg`.
3. Verleen Volledige schijftoegang en Automatisering-machtiging voor het proces dat OpenClaw/`imsg` uitvoert.
4. Verifieer RPC-ondersteuning met `imsg rpc --help`.

Voeg toe aan je OpenClaw-configuratie:

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

Start de gateway opnieuw. Nu kan je agent iMessages verzenden en ontvangen.

Volledige installatiedetails: [iMessage-kanaal](/nl/channels/imessage)

---

## Een golden image opslaan

Maak een snapshot van je schone staat voordat je verder aanpast:

```bash
lume stop openclaw
lume clone openclaw openclaw-golden
```

Op elk moment resetten:

```bash
lume stop openclaw && lume delete openclaw
lume clone openclaw-golden openclaw
lume run openclaw --no-display
```

---

## 24/7 draaien

Houd de VM draaiend door:

- Je Mac aangesloten te houden op netstroom
- Slaapstand uit te schakelen in Systeeminstellingen → Energiestand
- `caffeinate` te gebruiken indien nodig

Voor echt altijd actief gebruik kun je een toegewijde Mac mini of een kleine VPS overwegen. Zie [VPS-hosting](/nl/vps).

---

## Problemen oplossen

| Probleem                  | Oplossing                                                                                          |
| ------------------------- | -------------------------------------------------------------------------------------------------- |
| Kan niet via SSH naar VM  | Controleer of "Remote Login" is ingeschakeld in de Systeeminstellingen van de VM                   |
| VM-IP wordt niet getoond  | Wacht tot de VM volledig is opgestart en voer `lume get openclaw` opnieuw uit                      |
| Lume-opdracht niet gevonden | Voeg `~/.local/bin` toe aan je PATH                                                              |
| WhatsApp-QR scant niet    | Zorg dat je bent ingelogd op de VM (niet de host) wanneer je `openclaw channels login` uitvoert    |

---

## Gerelateerde documentatie

- [VPS-hosting](/nl/vps)
- [Nodes](/nl/nodes)
- [Gateway remote](/nl/gateway/remote)
- [iMessage-kanaal](/nl/channels/imessage)
- [Lume Quickstart](https://cua.ai/docs/lume/guide/getting-started/quickstart)
- [Lume CLI Reference](https://cua.ai/docs/lume/reference/cli-reference)
- [Unattended VM Setup](https://cua.ai/docs/lume/guide/fundamentals/unattended-setup) (geavanceerd)
- [Docker-sandboxing](/nl/install/docker) (alternatieve isolatieaanpak)
