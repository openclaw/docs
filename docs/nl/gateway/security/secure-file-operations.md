---
read_when:
    - Bestandstoegang, archiefextractie, werkruimteopslag of bestandssysteemhelpers voor plugins wijzigen
summary: Hoe OpenClaw lokale bestandstoegang veilig afhandelt en waarom de optionele Python-helper fs-safe standaard is uitgeschakeld
title: Veilige bestandsbewerkingen
x-i18n:
    generated_at: "2026-07-12T08:52:55Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 5c8edf36ddbb8c8bc1edc52ecdf481affe5395d1779c679a40439167dfe70299
    source_path: gateway/security/secure-file-operations.md
    workflow: 16
---

OpenClaw gebruikt [`@openclaw/fs-safe`](https://github.com/openclaw/fs-safe) voor beveiligingsgevoelige lokale bestandsbewerkingen: tot een hoofdmap begrensde lees- en schrijfbewerkingen, atomische vervanging, archiefextractie, tijdelijke werkruimten, JSON-status en verwerking van geheime bestanden.

Het is een **beveiligingsmechanisme in de bibliotheek** voor vertrouwde OpenClaw-code die niet-vertrouwde padnamen ontvangt, geen sandbox. Bestandssysteemmachtigingen van de host, gebruikers van het besturingssysteem, containers en het beleid voor agents en tools bepalen nog steeds het werkelijke bereik van mogelijke schade.

## Standaard: geen Python-helper

OpenClaw schakelt de POSIX Python-helper van fs-safe standaard **uit**:

- de Gateway hoort geen permanent Python-nevenproces te starten, tenzij een beheerder dit inschakelt;
- de meeste installaties hebben de aanvullende beveiliging tegen wijzigingen van bovenliggende mappen niet nodig;
- het uitschakelen van Python houdt het runtimegedrag voorspelbaar in desktop-, Docker-, CI- en gebundelde appomgevingen.

OpenClaw verandert alleen de _standaardwaarde_. Een expliciete instelling heeft altijd voorrang:

```bash
# Standaardgedrag van OpenClaw: uitsluitend Node-terugvalmechanismen van fs-safe.
OPENCLAW_FS_SAFE_PYTHON_MODE=off

# Schakel de helper in wanneer deze beschikbaar is en val terug als deze niet beschikbaar is.
OPENCLAW_FS_SAFE_PYTHON_MODE=auto

# Stop veilig als de helper niet kan starten.
OPENCLAW_FS_SAFE_PYTHON_MODE=require

# Optioneel expliciet pad naar de interpreter.
OPENCLAW_FS_SAFE_PYTHON=/usr/bin/python3
```

De algemene fs-safe-omgevingsvariabelen werken ook: `FS_SAFE_PYTHON_MODE` en `FS_SAFE_PYTHON`.

Gebruik `require` (niet `auto`) wanneer de helper deel uitmaakt van uw beveiligingsbeleid; `auto` valt zonder melding terug op uitsluitend Node-gedrag als de helper niet kan starten.

## Wat zonder Python beschermd blijft

Als de helper is uitgeschakeld, gebruikt OpenClaw nog steeds de uitsluitend op Node gebaseerde beveiligingsmechanismen van fs-safe:

- weigert ontsnappingen uit relatieve paden (`..`), absolute paden en padscheidingstekens waar alleen losse namen zijn toegestaan;
- voert bewerkingen uit via een vertrouwde verwijzing naar de hoofdmap in plaats van losse controles met `path.resolve(...).startsWith(...)`;
- weigert patronen met symbolische en harde koppelingen voor API's die dit beleid vereisen;
- opent bestanden met identiteitscontroles wanneer de API bestandsinhoud retourneert of verwerkt;
- schrijft status- en configuratiebestanden via een atomisch tijdelijk bestand in dezelfde map, gevolgd door hernoemen;
- dwingt limieten voor het aantal bytes af bij leesbewerkingen en archiefextractie;
- past privébestandsmodi toe op geheimen en statusbestanden waar de API dit vereist.

Dit dekt het normale dreigingsmodel van OpenClaw: vertrouwde Gateway-code die niet-vertrouwde padinvoer van modellen, Plugins en kanalen verwerkt binnen één vertrouwde beheerdersgrens.

## Wat Python toevoegt

Op POSIX houdt de optionele helper één permanent Python-proces actief en gebruikt deze bestandsysteembewerkingen ten opzichte van bestandsdescriptors voor wijzigingen aan bovenliggende mappen: hernoemen, verwijderen, mappen maken, status opvragen en inhoud weergeven, en bepaalde schrijfpaden.

Dit verkleint racevensters voor dezelfde gebruikers-ID waarin een ander proces een bovenliggende map verwisselt tussen validatie en wijziging — aanvullende beveiliging op hosts waar niet-vertrouwde lokale processen dezelfde mappen kunnen wijzigen waarin OpenClaw werkt.

Als uw implementatie dit risico loopt en Python gegarandeerd beschikbaar is, stelt u het volgende in:

```bash
OPENCLAW_FS_SAFE_PYTHON_MODE=require
```

## Richtlijnen voor Plugins en kerncode

- Bestandstoegang voor Plugins hoort via helpers van `openclaw/plugin-sdk/*` te verlopen, niet rechtstreeks via `fs`, wanneer een pad afkomstig is uit een bericht, modeluitvoer, configuratie of Plugin-invoer.
- Kerncode hoort de fs-safe-wrappers onder `src/infra/*` te gebruiken, zodat het procesbeleid van OpenClaw consistent wordt toegepast.
- Voor archiefextractie horen de fs-safe-archiefhelpers te worden gebruikt met expliciete limieten voor grootte, aantal vermeldingen, koppelingen en bestemming.
- Voor geheimen horen de geheimhelpers van OpenClaw of de fs-safe-helpers voor geheimen en privéstatus te worden gebruikt; implementeer niet zelf moduscontroles rond `fs.writeFile`.
- Vertrouw voor isolatie tegen kwaadwillende lokale gebruikers niet alleen op fs-safe. Voer afzonderlijke Gateways uit onder afzonderlijke gebruikers of hosts van het besturingssysteem, of gebruik sandboxing.

Zie ook: [Beveiliging](/nl/gateway/security), [Sandboxing](/nl/gateway/sandboxing), [Uitvoeringsgoedkeuringen](/nl/tools/exec-approvals), [Geheimen](/nl/gateway/secrets).
