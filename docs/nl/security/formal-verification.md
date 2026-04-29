---
permalink: /security/formal-verification/
read_when:
    - Formele garanties of beperkingen van het beveiligingsmodel beoordelen
    - TLA+/TLC-beveiligingsmodelcontroles reproduceren of bijwerken
summary: Machinaal gecontroleerde beveiligingsmodellen voor de paden met het hoogste risico van OpenClaw.
title: Formele verificatie (beveiligingsmodellen)
x-i18n:
    generated_at: "2026-04-29T23:18:24Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8f50fa9118a80054b8d556cd4f1901b2d5fcb37fb0866bd5357a1b0a46c74116
    source_path: security/formal-verification.md
    workflow: 16
---

Deze pagina houdt OpenClaw’s **formele beveiligingsmodellen** bij (vandaag TLA+/TLC; meer waar nodig).

> Opmerking: sommige oudere links kunnen verwijzen naar de vorige projectnaam.

**Doel (leidster):** een machinaal gecontroleerd argument leveren dat OpenClaw zijn
beoogde beveiligingsbeleid afdwingt (autorisatie, sessie-isolatie, toolafscherming en
veiligheid bij verkeerde configuratie), onder expliciete aannames.

**Wat dit is (vandaag):** een uitvoerbare, door aanvallers gestuurde **regressiesuite voor beveiliging**:

- Elke claim heeft een uitvoerbare modelcontrole over een eindige toestandsruimte.
- Veel claims hebben een gekoppeld **negatief model** dat een tegenvoorbeeldtrace produceert voor een realistische bugklasse.

**Wat dit (nog) niet is:** een bewijs dat “OpenClaw in alle opzichten veilig is” of dat de volledige TypeScript-implementatie correct is.

## Waar de modellen staan

Modellen worden onderhouden in een aparte repo: [vignesh07/openclaw-formal-models](https://github.com/vignesh07/openclaw-formal-models).

## Belangrijke kanttekeningen

- Dit zijn **modellen**, niet de volledige TypeScript-implementatie. Afwijking tussen model en code is mogelijk.
- Resultaten worden begrensd door de toestandsruimte die door TLC is onderzocht; “groen” impliceert geen beveiliging buiten de gemodelleerde aannames en grenzen.
- Sommige claims steunen op expliciete omgevingsaannames (bijv. correcte uitrol, correcte configuratie-invoer).

## Resultaten reproduceren

Vandaag worden resultaten gereproduceerd door de modellenrepo lokaal te klonen en TLC uit te voeren (zie hieronder). Een toekomstige iteratie zou kunnen bieden:

- door CI uitgevoerde modellen met openbare artefacten (tegenvoorbeeldtraces, runlogs)
- een gehoste workflow “dit model uitvoeren” voor kleine, begrensde controles

Aan de slag:

```bash
git clone https://github.com/vignesh07/openclaw-formal-models
cd openclaw-formal-models

# Java 11+ required (TLC runs on the JVM).
# The repo vendors a pinned `tla2tools.jar` (TLA+ tools) and provides `bin/tlc` + Make targets.

make <target>
```

### Gateway-blootstelling en verkeerde configuratie van open Gateway

**Claim:** binden buiten loopback zonder auth kan externe compromittering mogelijk maken / vergroot de blootstelling; token/wachtwoord blokkeert niet-geauthenticeerde aanvallers (volgens de modelaannames).

- Groene runs:
  - `make gateway-exposure-v2`
  - `make gateway-exposure-v2-protected`
- Rood (verwacht):
  - `make gateway-exposure-v2-negative`

Zie ook: `docs/gateway-exposure-matrix.md` in de modellenrepo.

### Node exec-pijplijn (capaciteit met het hoogste risico)

**Claim:** `exec host=node` vereist (a) een allowlist voor Node-opdrachten plus gedeclareerde opdrachten en (b) live goedkeuring wanneer geconfigureerd; goedkeuringen worden getokeniseerd om herhaling te voorkomen (in het model).

- Groene runs:
  - `make nodes-pipeline`
  - `make approvals-token`
- Rood (verwacht):
  - `make nodes-pipeline-negative`
  - `make approvals-token-negative`

### Koppelingsopslag (DM-afscherming)

**Claim:** koppelingsverzoeken respecteren TTL en limieten voor wachtende verzoeken.

- Groene runs:
  - `make pairing`
  - `make pairing-cap`
- Rood (verwacht):
  - `make pairing-negative`
  - `make pairing-cap-negative`

### Inkomende afscherming (vermeldingen + omzeiling van besturingsopdrachten)

**Claim:** in groepscontexten die een vermelding vereisen, kan een onbevoegde “besturingsopdracht” de vermeldingsafscherming niet omzeilen.

- Groen:
  - `make ingress-gating`
- Rood (verwacht):
  - `make ingress-gating-negative`

### Routerings-/sessiesleutelisolatie

**Claim:** DM’s van verschillende peers worden niet samengevoegd tot dezelfde sessie, tenzij ze expliciet gekoppeld/geconfigureerd zijn.

- Groen:
  - `make routing-isolation`
- Rood (verwacht):
  - `make routing-isolation-negative`

## v1++: aanvullende begrensde modellen (gelijktijdigheid, nieuwe pogingen, tracecorrectheid)

Dit zijn vervolgmodellen die de getrouwheid aanscherpen rond foutmodi uit de praktijk (niet-atomaire updates, nieuwe pogingen en bericht-fan-out).

### Gelijktijdigheid / idempotentie van koppelingsopslag

**Claim:** een koppelingsopslag moet `MaxPending` en idempotentie afdwingen, zelfs onder interleavings (d.w.z. “controleren-dan-schrijven” moet atomair / vergrendeld zijn; verversen mag geen duplicaten aanmaken).

Wat dit betekent:

- Bij gelijktijdige verzoeken kun je `MaxPending` voor een kanaal niet overschrijden.
- Herhaalde verzoeken/verversingen voor dezelfde `(channel, sender)` mogen geen dubbele live wachtende rijen aanmaken.

- Groene runs:
  - `make pairing-race` (atomaire/vergrendelde limietcontrole)
  - `make pairing-idempotency`
  - `make pairing-refresh`
  - `make pairing-refresh-race`
- Rood (verwacht):
  - `make pairing-race-negative` (niet-atomaire begin/commit-limietrace)
  - `make pairing-idempotency-negative`
  - `make pairing-refresh-negative`
  - `make pairing-refresh-race-negative`

### Correlatie / idempotentie van inkomende traces

**Claim:** ingestie moet tracecorrelatie over fan-out heen behouden en idempotent zijn bij nieuwe pogingen door providers.

Wat dit betekent:

- Wanneer één externe gebeurtenis meerdere interne berichten wordt, behoudt elk onderdeel dezelfde trace-/gebeurtenisidentiteit.
- Nieuwe pogingen leiden niet tot dubbele verwerking.
- Als provider-gebeurtenis-ID’s ontbreken, valt deduplicatie terug op een veilige sleutel (bijv. trace-ID) om te voorkomen dat verschillende gebeurtenissen worden verwijderd.

- Groen:
  - `make ingress-trace`
  - `make ingress-trace2`
  - `make ingress-idempotency`
  - `make ingress-dedupe-fallback`
- Rood (verwacht):
  - `make ingress-trace-negative`
  - `make ingress-trace2-negative`
  - `make ingress-idempotency-negative`
  - `make ingress-dedupe-fallback-negative`

### Routeringsvoorrang voor dmScope + identityLinks

**Claim:** routering moet DM-sessies standaard geïsoleerd houden en sessies alleen samenvoegen wanneer dit expliciet is geconfigureerd (kanaalvoorrang + identiteitslinks).

Wat dit betekent:

- Kanaalspecifieke dmScope-overschrijvingen moeten voorrang hebben op globale standaardwaarden.
- identityLinks mogen alleen samenvoegen binnen expliciet gekoppelde groepen, niet tussen niet-gerelateerde peers.

- Groen:
  - `make routing-precedence`
  - `make routing-identitylinks`
- Rood (verwacht):
  - `make routing-precedence-negative`
  - `make routing-identitylinks-negative`

## Gerelateerd

- [Dreigingsmodel](/nl/security/THREAT-MODEL-ATLAS)
- [Bijdragen aan het dreigingsmodel](/nl/security/CONTRIBUTING-THREAT-MODEL)
