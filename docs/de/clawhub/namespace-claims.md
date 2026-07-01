---
read_when:
    - Beanspruchen einer Organisation, Marke, eines Paket-Scopes, Owner-Handles, Skill-Slugs oder Paket-Namespace
    - Einen bereits beanspruchten oder reservierten Namespace auflösen
    - Entscheiden, ob ein Bericht, ein Einspruch oder ein Namespace-Anspruch verwendet werden soll
sidebarTitle: Org and Namespace Claims
summary: So beantragen Sie eine ClawHub-Prüfung bei Streitfällen zur Inhaberschaft von Organisation, Marke, Owner-Handle, Package-Scope, Skill-Slug oder Namespace.
title: Organisations- und Namespace-Ansprüche
x-i18n:
    generated_at: "2026-07-01T12:57:11Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 77a4d8090b55298c401154d116d93d4f8139d40983a45982288d8e48bcea40fb
    source_path: clawhub/namespace-claims.md
    workflow: 16
---

# Organisations- und Namespace-Ansprüche

ClawHub verwendet Owner-Handles, Organisations-Handles, Skill-Slugs, Plugin-Paketnamen und
Paket-Scopes als öffentliche Namespaces. Wenn ein Namespace zu einem
realen Projekt, einer Marke, einem Paket-Ökosystem oder einer Organisation zu gehören scheint, aber auf ClawHub bereits
beansprucht, reserviert, irreführend oder umstritten ist, bitten Sie das Team, ihn mit dem
[Formular für Organisations-/Namespace-Ansprüche](https://github.com/openclaw/clawhub/issues/new?template=org-namespace-claim.yml)
zu prüfen.

Verwenden Sie diesen Weg für öffentliche, nicht sensible Eigentumsprüfungen. Verwenden Sie keine
In-Produkt-Meldungen oder das Konto-Einspruchsformular für Namespace-Ansprüche.

## Wann Sie einen Anspruch eröffnen sollten

Eröffnen Sie einen Namespace-Anspruch, wenn Sie der Meinung sind, dass das ClawHub-Team prüfen sollte, ob ein
Namespace aufgrund realer Eigentumsverhältnisse reserviert, übertragen, umbenannt, ausgeblendet, isoliert, mit einem Alias versehen
oder anderweitig geändert werden sollte.

Beispiele:

- ein Organisations-Handle, das Ihrer GitHub-Organisation, Ihrem Projekt, Ihrem Unternehmen oder Ihrer Community entspricht
- ein Paket-Scope wie `@example-org/*`, das nur unter dem
  passenden ClawHub-Owner veröffentlichen sollte
- ein Skill-Slug oder Plugin-Paketname, der ein Projekt zu imitieren scheint
- ein Streitfall zu einer Marke, einem Warenzeichen, einer Projektumbenennung oder einer Pakethistorie
- ein gelöschter, inaktiver oder nicht erreichbarer Owner, der den rechtmäßigen Namespace-
  Owner blockiert

Wenn der Eintrag über den Eigentumsstreit hinaus unsicher, böswillig oder irreführend ist,
befolgen Sie zusätzlich die entsprechenden Moderations- oder Sicherheitshinweise. Das Namespace-Anspruchsformular
dient der Eigentumsprüfung, nicht der Notfallmeldung von Sicherheitslücken.

## Bevor Sie einreichen

Bestätigen Sie zuerst, dass Sie mit dem Owner veröffentlichen, der zum Namespace passt.
Für Plugin-Pakete müssen Scoped Names wie `@example-org/example-plugin` als
passender Owner `example-org` veröffentlicht werden.

Wenn Sie den aktuellen Owner verwalten können, korrigieren Sie den Namespace direkt durch Veröffentlichen,
Umbenennen, Übertragen, Ausblenden oder Löschen der betroffenen Ressource. Verwenden Sie einen Anspruch,
wenn Sie den aktuellen Owner nicht verwalten können oder wenn das Team einen
Streitfall lösen muss.

## Einzuschließende Nachweise

Verwenden Sie öffentliche, nicht sensible Nachweise. Hilfreiche Nachweise sind unter anderem:

- GitHub-Organisation, Repository, Release oder Maintainer-Historie
- offizielle Projektdokumentation, die den Namespace nennt
- Domain- oder offizieller E-Mail-Domain-Nachweis
- Kontrolle über npm-, PyPI-, crates.io- oder andere Paket-Registry-Scopes
- Nachweise zu Warenzeichen, Marke oder Projekteigentum, die öffentlich sicher besprochen
  werden können
- Historie des Quell-Repositorys, Pakethistorie oder öffentliche Umbenennungsmitteilungen
- Links zum umstrittenen ClawHub-Owner, Skill, Plugin, Paket oder Issue

Erklären Sie, was jeder Link belegt. Das Team sollte die
Beziehung verstehen können, ohne private Anmeldedaten oder Geheimnisse zu benötigen.

## Was Sie nicht einschließen sollten

Stellen Sie keine Geheimnisse oder privaten Nachweise in ein öffentliches GitHub-Issue. Schließen Sie Folgendes nicht ein:

- API-Tokens, Signaturschlüssel oder Anmeldedaten
- DNS-Challenge-Tokens
- private Rechtsdokumente oder Verträge
- persönliche Ausweisdokumente
- private E-Mails, private Sicherheitsberichte oder vertrauliche Kundendaten

Das Anspruchsformular fragt, ob sensible Nachweise einen privaten Team-Kanal benötigen.
Verwenden Sie diese Option, statt sensibles Material öffentlich zu posten.

## Mögliche Ergebnisse

Je nach Nachweisen und Risiko kann das ClawHub-Team einen Namespace reservieren,
Eigentum übertragen, eine Ressource umbenennen, einen bestehenden Eintrag ausblenden oder isolieren,
einen Alias oder eine Weiterleitung hinzufügen, weitere Nachweise anfordern oder die Anfrage ablehnen.

Die Namespace-Prüfung garantiert nicht, dass jeder passende Name übertragen wird.
Das Team wägt öffentliche Nachweise, bestehende Nutzung, Sicherheitsrisiko und Auswirkungen auf Nutzer ab.

## Verwandte Dokumentation

- [Veröffentlichen](/de/clawhub/publishing)
- [Fehlerbehebung](/clawhub/troubleshooting#publish-fails-because-a-namespace-is-claimed-or-reserved)
- [Moderation und Kontosicherheit](/clawhub/moderation)
- [Sicherheit](/clawhub/security)
