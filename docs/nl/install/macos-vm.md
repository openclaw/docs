---
read_when:
    - Je wilt OpenClaw isoleren van je primaire macOS-omgeving
    - Je wilt iMessage-integratie in een sandbox
    - U wilt een resetbare macOS-omgeving die u kunt klonen
    - Je wilt lokale en gehoste opties voor macOS-VM's vergelijken
summary: Voer OpenClaw uit in een geïsoleerde macOS-VM (lokaal of gehost) wanneer je isolatie of iMessage nodig hebt
title: macOS-VM's
x-i18n:
    generated_at: "2026-07-12T09:04:02Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7e6b963faaf40f65adce1081715bc295059b8bed278a8c71a05a86e04ad7a7a5
    source_path: install/macos-vm.md
    workflow: 16
---

## Aanbevolen standaardoptie (de meeste gebruikers)

- **Kleine Linux-VPS** voor een Gateway die altijd actief is, tegen lage kosten. Zie [VPS-hosting](/nl/vps).
- **Speciale hardware** (Mac mini of Linux-machine) als je volledige controle en een **residentieel IP-adres** voor browserautomatisering wilt. Veel sites blokkeren IP-adressen van datacenters, waardoor lokaal browsen vaak beter werkt.
- **Hybride**: laat de Gateway op een goedkope VPS draaien en verbind je Mac als een **Node** wanneer je browser-/UI-automatisering nodig hebt. Zie [Nodes](/nl/nodes) en [Gateway op afstand](/nl/gateway/remote).

Gebruik alleen een macOS-VM wanneer je specifiek mogelijkheden nodig hebt die uitsluitend op macOS beschikbaar zijn, zoals iMessage, of wanneer je strikte isolatie van je dagelijkse Mac wilt.

## Opties voor macOS-VM's

### Lokale VM op je Apple Silicon-Mac (Lume)

Voer OpenClaw uit in een geïsoleerde macOS-VM op je bestaande Apple Silicon-Mac met [Lume](https://cua.ai/docs/lume). Dit biedt je:

- Een volledige macOS-omgeving in isolatie (je hostsysteem blijft schoon)
- Ondersteuning voor iMessage via `imsg`; het standaard lokale pad is niet mogelijk op Linux/Windows
- Direct opnieuw instellen door VM's te klonen
- Geen extra hardware- of cloudkosten

### Gehoste Mac-aanbieders (cloud)

Als je macOS in de cloud wilt gebruiken, werken gehoste Mac-aanbieders ook:

- [MacStadium](https://www.macstadium.com/) (gehoste Macs)
- Andere aanbieders van gehoste Macs werken ook; volg hun documentatie voor VM's en SSH

Zodra je SSH-toegang tot een macOS-VM hebt, ga je hieronder verder bij [OpenClaw installeren](#6-install-openclaw).

## Snel aan de slag (Lume, ervaren gebruikers)

1. Installeer Lume.
2. `lume create openclaw --os macos --ipsw latest`
3. Voltooi de configuratie-assistent en schakel Remote Login (SSH) in.
4. `lume run openclaw --no-display`
5. Maak verbinding via SSH, installeer OpenClaw en configureer kanalen.
6. Klaar.

## Wat je nodig hebt (Lume)

- Apple Silicon-Mac (M1/M2/M3/M4)
- macOS Sequoia of nieuwer op het hostsysteem
- Circa 60 GB vrije schijfruimte per VM
- Circa 20 minuten

## 1) Lume installeren

```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/trycua/cua/main/libs/lume/scripts/install.sh)"
```

Als `~/.local/bin` niet in je PATH staat:

```bash
echo 'export PATH="$PATH:$HOME/.local/bin"' >> ~/.zshrc && source ~/.zshrc
```

Controleer de installatie:

```bash
lume --version
```

Documentatie: [Lume-installatie](https://cua.ai/docs/lume/guide/getting-started/installation)

## 2) De macOS-VM maken

```bash
lume create openclaw --os macos --ipsw latest
```

Hiermee wordt macOS gedownload en de VM gemaakt. Er wordt automatisch een VNC-venster geopend.

<Note>
Afhankelijk van je verbinding kan het downloaden enige tijd duren.
</Note>

## 3) De configuratie-assistent voltooien

In het VNC-venster:

1. Selecteer de taal en regio.
2. Sla Apple ID over (of meld je aan als je later iMessage wilt gebruiken).
3. Maak een gebruikersaccount aan (onthoud de gebruikersnaam en het wachtwoord).
4. Sla alle optionele functies over.

Nadat de configuratie is voltooid:

1. Schakel SSH in: System Settings -> General -> Sharing en schakel "Remote Login" in.
2. Schakel voor gebruik van de VM zonder grafische interface automatisch aanmelden in: System Settings -> Users & Groups, selecteer "Automatically log in as:" en kies de VM-gebruiker.

## 4) Het IP-adres van de VM opvragen

```bash
lume get openclaw
```

Zoek het IP-adres (meestal `192.168.64.x`).

## 5) Via SSH verbinding maken met de VM

```bash
ssh youruser@192.168.64.X
```

Vervang `youruser` door het account dat je hebt aangemaakt en het IP-adres door het IP-adres van je VM.

## 6) OpenClaw installeren

In de VM:

```bash
npm install -g openclaw@latest
openclaw onboard --install-daemon
```

Volg de introductievragen om je modelaanbieder (Anthropic, OpenAI enzovoort) in te stellen.

## 7) Kanalen configureren

Bewerk het configuratiebestand:

```bash
nano ~/.openclaw/openclaw.json
```

Voeg je kanalen toe:

```json5
{
  channels: {
    telegram: {
      botToken: "YOUR_BOT_TOKEN",
    },
    whatsapp: {
      dmPolicy: "allowlist",
      allowFrom: ["+15551234567"],
    },
  },
}
```

Meld je vervolgens aan bij WhatsApp (scan de QR-code):

```bash
openclaw channels login
```

## 8) De VM zonder grafische interface uitvoeren

Stop de VM en start deze opnieuw zonder beeldscherm:

```bash
lume stop openclaw
lume run openclaw --no-display
```

De VM wordt op de achtergrond uitgevoerd; de daemon van OpenClaw houdt de Gateway actief. Controleer de status als volgt:

```bash
ssh youruser@192.168.64.X "openclaw status"
```

## Extra: iMessage-integratie

Dit is de belangrijkste meerwaarde van uitvoering op macOS. Gebruik [iMessage](/nl/channels/imessage) met `imsg` om Berichten aan OpenClaw toe te voegen.

In de VM:

1. Meld je aan bij Berichten.
2. Installeer `imsg`.
3. Verleen volledige schijftoegang en automatiseringsrechten aan het proces dat OpenClaw/`imsg` uitvoert.
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

Start de Gateway opnieuw. Je agent kan nu iMessages verzenden en ontvangen. Volledige configuratie-instructies: [iMessage-kanaal](/nl/channels/imessage).

## Een gouden image opslaan

Maak voordat je verdere aanpassingen uitvoert een momentopname van je schone toestand:

```bash
lume stop openclaw
lume clone openclaw openclaw-golden
```

Je kunt op elk gewenst moment opnieuw instellen:

```bash
lume stop openclaw && lume delete openclaw
lume clone openclaw-golden openclaw
lume run openclaw --no-display
```

## 24/7 uitvoeren

Houd de VM actief door:

- Je Mac op de stroom aangesloten te houden
- De sluimerstand uit te schakelen via System Settings -> Energy Saver
- Indien nodig `caffeinate` te gebruiken

Overweeg voor werkelijk permanente beschikbaarheid een speciale Mac mini of een kleine VPS. Zie [VPS-hosting](/nl/vps).

## Problemen oplossen

| Probleem                          | Oplossing                                                                                                    |
| --------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| Kan geen SSH-verbinding met VM maken | Controleer of "Remote Login" is ingeschakeld in de System Settings van de VM                              |
| IP-adres van VM wordt niet weergegeven | Wacht tot de VM volledig is opgestart en voer `lume get openclaw` opnieuw uit                           |
| Lume-opdracht niet gevonden       | Voeg `~/.local/bin` toe aan je PATH                                                                          |
| WhatsApp-QR-code wordt niet gescand | Zorg dat je bij de VM bent aangemeld (niet bij het hostsysteem) wanneer je `openclaw channels login` uitvoert |

## Gerelateerde documentatie

- [VPS-hosting](/nl/vps)
- [Nodes](/nl/nodes)
- [Gateway op afstand](/nl/gateway/remote)
- [iMessage-kanaal](/nl/channels/imessage)
- [Lume-snelstartgids](https://cua.ai/docs/lume/guide/getting-started/quickstart)
- [Lume CLI-referentie](https://cua.ai/docs/lume/reference/cli-reference)
- [Onbeheerde VM-configuratie](https://cua.ai/docs/lume/guide/fundamentals/unattended-setup) (geavanceerd)
- [Docker-sandboxing](/nl/install/docker) (alternatieve isolatiemethode)
