---
read_when:
    - Reageren op een beveiligingsrapport of een vermoedelijk beveiligingsincident
    - Een gecoördineerde openbaarmaking of gepatchte beveiligingsrelease voorbereiden
    - Verwachtingen voor opvolging na incidenten beoordelen
summary: Hoe OpenClaw beveiligingsincidenten triageert, erop reageert en opvolgt
title: Incidentrespons
x-i18n:
    generated_at: "2026-05-06T09:32:20Z"
    model: gpt-5.5
    provider: openai
    source_hash: 546b69242fc4674e3d27e79e4c7b5cfecb83bcb17e8edb2a4b62f1a7498fb84f
    source_path: security/incident-response.md
    workflow: 16
---

## 1. Detectie en triage

We monitoren beveiligingssignalen van:

- GitHub Security Advisories (GHSA) en privékwetsbaarheidsmeldingen.
- Openbare GitHub-issues/discussies wanneer meldingen niet gevoelig zijn.
- Geautomatiseerde signalen (bijvoorbeeld Dependabot, CodeQL, npm-adviezen en scannen op geheimen).

Eerste triage:

1. Bevestig de betrokken component, versie en impact op de vertrouwensgrens.
2. Classificeer als beveiligingsprobleem versus versterking/geen actie met behulp van het bereik en de regels voor buiten-bereik in de repository-`SECURITY.md`.
3. Een incidenteigenaar reageert dienovereenkomstig.

## 2. Beoordeling

Ernstleidraad:

- **Kritiek:** Compromittering van pakket/release/repository, actieve uitbuiting, of niet-geauthenticeerde omzeiling van de vertrouwensgrens met zeer ingrijpende controle of blootstelling van gegevens.
- **Hoog:** Geverifieerde omzeiling van de vertrouwensgrens waarvoor beperkte randvoorwaarden nodig zijn (bijvoorbeeld een geauthenticeerde maar niet-geautoriseerde actie met grote impact), of blootstelling van gevoelige inloggegevens die eigendom zijn van OpenClaw.
- **Middel:** Aanzienlijke beveiligingszwakte met praktische impact maar beperkte uitbuitbaarheid of substantiële vereisten.
- **Laag:** Bevindingen voor gelaagde verdediging, nauw afgebakende dienstweigering, of hiaten in versterking/pariteit zonder aangetoonde omzeiling van de vertrouwensgrens.

## 3. Reactie

1. Bevestig ontvangst aan de melder (privé wanneer gevoelig).
2. Reproduceer op ondersteunde releases en de nieuwste `main`, implementeer en valideer vervolgens een patch met regressiedekking.
3. Bereid voor kritieke/hoge incidenten zo snel als praktisch haalbaar gepatchte release(s) voor.
4. Patch middelhoge/lage incidenten binnen de normale releaseflow en documenteer mitigerende richtlijnen.

## 4. Communicatie

We communiceren via:

- GitHub Security Advisories in de betrokken repository.
- Releaseopmerkingen/changelog-vermeldingen voor gerepareerde versies.
- Directe opvolging met de melder over status en oplossing.

Openbaarmakingsbeleid:

- Kritieke/hoge incidenten moeten gecoördineerde openbaarmaking krijgen, met CVE-uitgifte wanneer passend.
- Bevindingen voor versterking met laag risico kunnen worden gedocumenteerd in releaseopmerkingen of adviezen zonder CVE, afhankelijk van impact en blootstelling van gebruikers.

## 5. Herstel en opvolging

Na het uitbrengen van de fix:

1. Verifieer herstelmaatregelen in CI en release-artefacten.
2. Voer een korte incidentreview uit (tijdlijn, hoofdoorzaak, detectiekloof, preventieplan).
3. Voeg vervolgtaken voor versterking/tests/docs toe en volg ze tot voltooiing.
