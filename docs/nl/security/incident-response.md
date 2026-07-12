---
read_when:
    - Reageren op een beveiligingsmelding of vermoedelijk beveiligingsincident
    - Een gecoördineerde bekendmaking of beveiligingsrelease met patch voorbereiden
    - Verwachtingen voor de opvolging na een incident beoordelen
summary: Hoe OpenClaw beveiligingsincidenten triageert, erop reageert en opvolgt
title: Incidentrespons
x-i18n:
    generated_at: "2026-07-12T09:26:15Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 30f2d754408e95133ee86254ce193c0d8aab293040df55e0c1cec0c4d7644c56
    source_path: security/incident-response.md
    workflow: 16
---

## 1. Detectie en triage

Beveiligingssignalen zijn afkomstig van:

- GitHub Security Advisories (GHSA) en privé gemelde kwetsbaarheden.
- Openbare GitHub-issues/-discussies wanneer meldingen niet gevoelig zijn.
- Geautomatiseerde signalen: Dependabot, CodeQL, npm-beveiligingsadviezen en geheimenscans.

Eerste triage:

1. Bevestig het getroffen onderdeel, de versie en de impact op de vertrouwensgrens.
2. Classificeer het als een beveiligingsprobleem of als beveiligingsversterking/geen actie, aan de hand van de regels voor binnen en buiten het toepassingsgebied in `SECURITY.md`.
3. Een incidenteigenaar reageert dienovereenkomstig.

## 2. Ernst

| Ernst    | Definitie                                                                                                                                                                                           |
| -------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Kritiek  | Compromittering van een pakket, release of repository, actieve uitbuiting of het zonder authenticatie omzeilen van een vertrouwensgrens met ingrijpende controle of blootstelling van gegevens.       |
| Hoog     | Geverifieerde omzeiling van een vertrouwensgrens waarvoor beperkte voorwaarden gelden (bijvoorbeeld een geauthenticeerde maar niet-geautoriseerde ingrijpende actie), of blootstelling van gevoelige referentiegegevens die eigendom zijn van OpenClaw. |
| Gemiddeld | Aanzienlijke beveiligingszwakte met praktische gevolgen, maar met beperkte mogelijkheden tot uitbuiting of aanzienlijke vereisten.                                                                  |
| Laag     | Bevindingen voor gelaagde beveiliging, nauw afgebakende denial-of-service of tekortkomingen in beveiligingsversterking/pariteit zonder aangetoonde omzeiling van een vertrouwensgrens.                 |

## 3. Respons

1. Bevestig de ontvangst aan de melder (privé wanneer de melding gevoelig is).
2. Reproduceer het probleem op ondersteunde releases en de nieuwste `main`, implementeer en valideer vervolgens een patch met regressiedekking.
3. Kritiek/hoog: bereid zo snel als praktisch mogelijk gepatchte release(s) voor.
4. Gemiddeld/laag: pas de patch toe via het normale releaseproces en documenteer richtlijnen voor risicobeperking.

## 4. Communicatie en openbaarmaking

Communiceer via GitHub Security Advisories in de getroffen repository, releaseopmerkingen/changelogvermeldingen voor gecorrigeerde versies en rechtstreekse opvolging bij de melder over de status en oplossing.

Voor kritieke/hoog-risico-incidenten vindt gecoördineerde openbaarmaking plaats, met uitgifte van een CVE indien van toepassing. Bevindingen over beveiligingsversterking met een laag risico kunnen, afhankelijk van de impact en blootstelling van gebruikers, zonder CVE worden gedocumenteerd in releaseopmerkingen of beveiligingsadviezen.

## 5. Herstel en opvolging

Na het uitbrengen van de oplossing:

1. Verifieer de herstelmaatregelen in CI en releaseartefacten.
2. Voer een korte evaluatie na het incident uit: tijdlijn, hoofdoorzaak, tekortkoming in de detectie en preventieplan.
3. Voeg opvolgtaken voor beveiligingsversterking, tests en documentatie toe en volg deze tot voltooiing.

## Gerelateerd

- [Beveiligingsbeleid](https://github.com/openclaw/openclaw/blob/main/SECURITY.md) — toepassingsgebied voor meldingen en vertrouwensmodel.
- [Dreigingsmodel](/nl/security/THREAT-MODEL-ATLAS)
