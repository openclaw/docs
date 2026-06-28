---
read_when:
    - Bestandstoegang, archiefextractie, werkruimteopslag of Plugin-bestandssysteemhelpers wijzigen
summary: Hoe OpenClaw veilig omgaat met lokale bestandstoegang, en waarom de optionele fs-safe Python-helper standaard is uitgeschakeld
title: Veilige bestandsbewerkingen
x-i18n:
    generated_at: "2026-05-06T09:16:17Z"
    model: gpt-5.5
    provider: openai
    source_hash: 19d5b31ec2f2c7ab1033bdb55a701c60468dfac58142f726ecbc9ac933f68e30
    source_path: gateway/security/secure-file-operations.md
    workflow: 16
    postprocess_version: locale-links-v1
---

OpenClaw gebruikt [`@openclaw/fs-safe`](https://github.com/openclaw/fs-safe) voor beveiligingsgevoelige lokale bestandsbewerkingen: root-gebonden lees-/schrijfbewerkingen, atomische vervanging, archiefextractie, tijdelijke werkruimten, JSON-status en afhandeling van geheime bestanden.

Het doel is een consistente **bibliotheekvangrail** voor vertrouwde OpenClaw-code die onvertrouwde padnamen ontvangt. Het is geen sandbox. Hostbestandssysteemrechten, OS-gebruikers, containers en het agent-/toolbeleid bepalen nog steeds de werkelijke impactradius.

## Standaard: geen Python-helper

OpenClaw zet de fs-safe POSIX Python-helper standaard **uit**.

Waarom:

- de gateway zou geen permanente Python-sidecar moeten starten tenzij een operator daarvoor heeft gekozen;
- veel installaties hebben de extra hardening tegen mutaties in bovenliggende mappen niet nodig;
- het uitschakelen van Python houdt pakket-/runtimegedrag voorspelbaarder in desktop-, Docker-, CI- en gebundelde appomgevingen.

OpenClaw wijzigt alleen de standaardinstelling. Als je expliciet een modus instelt, respecteert fs-safe die:

```bash
# Default OpenClaw behavior: Node-only fs-safe fallbacks.
OPENCLAW_FS_SAFE_PYTHON_MODE=off

# Opt into the helper when available, falling back if unavailable.
OPENCLAW_FS_SAFE_PYTHON_MODE=auto

# Fail closed if the helper cannot start.
OPENCLAW_FS_SAFE_PYTHON_MODE=require

# Optional explicit interpreter.
OPENCLAW_FS_SAFE_PYTHON=/usr/bin/python3
```

De generieke fs-safe-namen werken ook: `FS_SAFE_PYTHON_MODE` en `FS_SAFE_PYTHON`.

## Wat beschermd blijft zonder Python

Met de helper uit gebruikt OpenClaw nog steeds de Node-paden van fs-safe voor:

- het weigeren van relatieve padontsnappingen zoals `..`, absolute paden en padscheidingstekens waar alleen namen zijn toegestaan;
- het oplossen van bewerkingen via een vertrouwde roothandle in plaats van ad-hoccontroles met `path.resolve(...).startsWith(...)`;
- het weigeren van symlink- en hardlinkpatronen op API's die dat beleid vereisen;
- het openen van bestanden met identiteitscontroles waar de API bestandsinhoud retourneert of verbruikt;
- atomische sibling-temp-schrijfbewerkingen voor status-/configuratiebestanden;
- byte-limieten voor leesbewerkingen en archiefextractie;
- privémodi voor geheimen en statusbestanden waar de API die vereist.

Deze beschermingen dekken het normale OpenClaw-dreigingsmodel: vertrouwde Gateway-code die onvertrouwde model-/Plugin-/kanaalpadinvoer afhandelt binnen één vertrouwde operatorgrens.

## Wat Python toevoegt

Op POSIX houdt de optionele helper van fs-safe één permanent Python-proces actief en gebruikt fd-relatieve bestandssysteembewerkingen voor mutaties in bovenliggende mappen, zoals hernoemen, verwijderen, mkdir, stat/list en sommige schrijfpaden.

Dat verkleint same-UID-racevensters waarin een ander proces een bovenliggende map kan verwisselen tussen validatie en mutatie. Het is defense in depth voor hosts waar onvertrouwde lokale processen dezelfde mappen kunnen wijzigen waarin OpenClaw werkt.

Als je deployment dat risico heeft en gegarandeerd Python beschikbaar is, gebruik dan:

```bash
OPENCLAW_FS_SAFE_PYTHON_MODE=require
```

Gebruik `require` in plaats van `auto` wanneer de helper deel uitmaakt van je beveiligingspositie; `auto` valt bewust terug op Node-only-gedrag als de helper niet beschikbaar is.

## Richtlijnen voor Plugin en core

- Bestandsaccess voor Plugins moet via helpers van `openclaw/plugin-sdk/*` lopen, niet via raw `fs`, wanneer een pad afkomstig is uit een bericht, modeluitvoer, configuratie of Plugin-invoer.
- Core-code moet de lokale fs-safe-wrappers onder `src/infra/*` gebruiken, zodat het procesbeleid van OpenClaw consistent wordt toegepast.
- Archiefextractie moet de fs-safe-archiefhelpers gebruiken met expliciete limieten voor grootte, aantal entries, links en bestemming.
- Geheimen moeten OpenClaw-geheimhelpers of fs-safe-geheim-/privéstatushelpers gebruiken; schrijf geen eigen mode-controles rond `fs.writeFile`.
- Als je isolatie tegen vijandige lokale gebruikers nodig hebt, vertrouw dan niet alleen op fs-safe. Voer afzonderlijke gateways uit onder afzonderlijke OS-gebruikers/hosts of gebruik sandboxing.

Gerelateerd: [Beveiliging](/nl/gateway/security), [Sandboxing](/nl/gateway/sandboxing), [Exec-goedkeuringen](/nl/tools/exec-approvals), [Geheimen](/nl/gateway/secrets).
