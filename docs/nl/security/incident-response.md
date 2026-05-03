---
read_when:
    - Reageren op een beveiligingsmelding of een vermoedelijk beveiligingsincident
    - Een gecoördineerde openbaarmaking of gepatchte beveiligingsrelease voorbereiden
    - Verwachtingen voor opvolging na incidenten beoordelen
summary: Hoe OpenClaw beveiligingsincidenten triageert, erop reageert en opvolgt
title: Incidentrespons
x-i18n:
    generated_at: "2026-05-03T21:37:24Z"
    model: gpt-5.5
    provider: openai
    source_hash: ef39b037cf3574a61fd67b356654f1ea0b91d84f89345c22aae93c1db7694df8
    source_path: security/incident-response.md
    workflow: 16
---

# Incidentrespons

## 1. Detectie en triage

We monitoren beveiligingssignalen uit:

- GitHub Security Advisories (GHSA) en privékwetsbaarheidsmeldingen.
- Openbare GitHub-issues/discussies wanneer meldingen niet gevoelig zijn.
- Geautomatiseerde signalen (bijvoorbeeld Dependabot, CodeQL, npm-adviezen en secret scanning).

Initiële triage:

1. Bevestig het getroffen onderdeel, de versie en de impact op de vertrouwensgrens.
2. Classificeer als beveiligingsprobleem versus verharding/geen actie met behulp van de scope en buiten-scope-regels in de repository-`SECURITY.md`.
3. Een incident-eigenaar reageert dienovereenkomstig.

## 2. Beoordeling

Ernstgids:

- **Kritiek:** Compromittering van pakket/release/repository, actieve exploitatie, of een niet-geauthenticeerde omzeiling van de vertrouwensgrens met controle met hoge impact of blootstelling van gegevens.
- **Hoog:** Geverifieerde omzeiling van de vertrouwensgrens die beperkte randvoorwaarden vereist (bijvoorbeeld een geauthenticeerde maar niet-geautoriseerde actie met hoge impact), of blootstelling van gevoelige inloggegevens die eigendom zijn van OpenClaw.
- **Middel:** Aanzienlijke beveiligingszwakte met praktische impact, maar met beperkte exploiteerbaarheid of aanzienlijke vereisten vooraf.
- **Laag:** Bevindingen voor gelaagde verdediging, nauw afgebakende denial-of-service, of hiaten in verharding/pariteit zonder aangetoonde omzeiling van de vertrouwensgrens.

## 3. Respons

1. Bevestig ontvangst aan de melder (privé wanneer gevoelig).
2. Reproduceer op ondersteunde releases en de nieuwste `main`, implementeer en valideer vervolgens een patch met regressiedekking.
3. Bereid voor kritieke/hoge incidenten gepatchte release(s) zo snel als praktisch haalbaar voor.
4. Patch middelmatige/lage incidenten in de normale releaseflow en documenteer mitigatierichtlijnen.

## 4. Communicatie

We communiceren via:

- GitHub Security Advisories in de getroffen repository.
- Release-opmerkingen/changelog-items voor gerepareerde versies.
- Directe opvolging met de melder over status en oplossing.

Openbaarmakingsbeleid:

- Kritieke/hoge incidenten moeten gecoördineerde openbaarmaking krijgen, met CVE-uitgifte wanneer passend.
- Verhardingsbevindingen met laag risico kunnen worden gedocumenteerd in release-opmerkingen of adviezen zonder CVE, afhankelijk van impact en blootstelling van gebruikers.

## 5. Herstel en opvolging

Na het uitbrengen van de fix:

1. Verifieer remediaties in CI en release-artefacten.
2. Voer een korte post-incidentreview uit (tijdlijn, hoofdoorzaak, detectiehiaat, preventieplan).
3. Voeg opvolgtaken voor verharding/tests/docs toe en volg ze tot voltooiing.
