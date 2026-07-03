---
read_when:
    - Beanspruchen einer Organisation, Marke, eines Paket-Scopes, Owner-Handles, Skill-Slugs oder Paket-Namespace
    - Auflösen eines Namespace, der bereits beansprucht oder reserviert ist
    - Entscheiden, ob ein Bericht, ein Einspruch oder ein Namespace-Anspruch verwendet werden soll
sidebarTitle: Org and Namespace Claims
summary: So beantragen Sie eine ClawHub-Überprüfung bei Streitfällen um Organisations-, Marken-, Owner-Handle-, Package-Scope-, Skill-Slug- oder Namespace-Inhaberschaft.
title: Organisations- und Namespace-Ansprüche
x-i18n:
    generated_at: "2026-07-03T00:54:22Z"
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
realen Projekt, einer Marke, einem Paket-Ökosystem oder einer Organisation zu gehören scheint, aber auf
ClawHub bereits beansprucht, reserviert, irreführend oder umstritten ist, bitten Sie das Personal um eine Prüfung
mit dem
[Issue-Formular für Organisations-/Namespace-Ansprüche](https://github.com/openclaw/clawhub/issues/new?template=org-namespace-claim.yml).

Verwenden Sie diesen Weg für öffentliche, nicht sensible Eigentumsprüfungen. Verwenden Sie keine produktinternen
Meldungen oder das Formular für Konto-Einsprüche für Namespace-Ansprüche.

## Wann Sie einen Anspruch eröffnen sollten

Eröffnen Sie einen Namespace-Anspruch, wenn Sie der Meinung sind, dass das ClawHub-Personal prüfen sollte, ob ein
Namespace aufgrund realer Eigentumsverhältnisse reserviert, übertragen, umbenannt, ausgeblendet, unter Quarantäne gestellt, mit einem Alias versehen
oder anderweitig geändert werden sollte.

Beispiele sind:

- ein Organisations-Handle, das Ihrer GitHub-Organisation, Ihrem Projekt, Ihrem Unternehmen oder Ihrer Community entspricht
- ein Paket-Scope wie `@example-org/*`, der nur unter dem
  passenden ClawHub-Owner veröffentlichen sollte
- ein Skill-Slug oder Plugin-Paketname, der ein Projekt zu imitieren scheint
- ein Streit um eine Marke, ein Warenzeichen, eine Projektumbenennung oder eine Pakethistorie
- ein gelöschter, inaktiver oder unerreichbarer Owner, der den rechtmäßigen Namespace-Owner
  blockiert

Wenn der Eintrag über den Eigentumsstreit hinaus unsicher, bösartig oder irreführend ist,
befolgen Sie außerdem die entsprechenden Moderations- oder Sicherheitshinweise. Das Formular für Namespace-Ansprüche
ist für Eigentumsprüfungen vorgesehen, nicht für die Offenlegung von Notfall-Schwachstellen.

## Bevor Sie einreichen

Bestätigen Sie zuerst, dass Sie mit dem Owner veröffentlichen, der zum Namespace passt.
Bei Plugin-Paketen müssen scoped Namen wie `@example-org/example-plugin` als
passender Owner `example-org` veröffentlicht werden.

Wenn Sie den aktuellen Owner verwalten können, beheben Sie den Namespace direkt durch Veröffentlichen,
Umbenennen, Übertragen, Ausblenden oder Löschen der betroffenen Ressource. Verwenden Sie einen Anspruch,
wenn Sie den aktuellen Owner nicht verwalten können oder wenn das Personal einen
Streitfall lösen muss.

## Belege, die Sie einfügen sollten

Verwenden Sie öffentliche, nicht sensible Belege. Hilfreiche Nachweise sind:

- GitHub-Organisations-, Repository-, Release- oder Maintainer-Historie
- offizielle Projektdokumentation, die den Namespace nennt
- Domain- oder offizieller E-Mail-Domain-Nachweis
- Kontrolle über npm-, PyPI-, crates.io- oder andere Paket-Registry-Scopes
- Nachweise zu Warenzeichen, Marke oder Projekteigentum, die öffentlich besprochen werden können
- Historie des Quell-Repositorys, Pakethistorie oder öffentliche Umbenennungshinweise
- Links zum umstrittenen ClawHub-Owner, Skill, Plugin, Paket oder Issue

Erklären Sie, was jeder Link belegt. Das Personal sollte die
Beziehung verstehen können, ohne private Anmeldedaten oder Geheimnisse zu benötigen.

## Was Sie nicht einfügen sollten

Stellen Sie keine Geheimnisse oder privaten Nachweise in ein öffentliches GitHub-Issue. Fügen Sie Folgendes nicht ein:

- API-Token, Signierschlüssel oder Anmeldedaten
- DNS-Challenge-Token
- private juristische Dateien oder Verträge
- persönliche Ausweisdokumente
- private E-Mails, private Sicherheitsberichte oder vertrauliche Kundendaten

Das Anspruchsformular fragt, ob sensible Belege einen privaten Kanal zum Personal benötigen.
Verwenden Sie diese Option, statt sensibles Material öffentlich zu posten.

## Mögliche Ergebnisse

Je nach Belegen und Risiko kann das ClawHub-Personal einen Namespace reservieren,
Eigentum übertragen, eine Ressource umbenennen, einen vorhandenen Eintrag ausblenden oder unter Quarantäne stellen,
einen Alias oder eine Weiterleitung hinzufügen, weitere Nachweise anfordern oder die Anfrage ablehnen.

Die Namespace-Prüfung garantiert nicht, dass jeder passende Name übertragen wird.
Das Personal wägt öffentliche Belege, bestehende Nutzung, Sicherheitsrisiko und Auswirkungen auf Benutzer ab.

## Zugehörige Dokumentation

- [Veröffentlichen](/de/clawhub/publishing)
- [Fehlerbehebung](/clawhub/troubleshooting#publish-fails-because-a-namespace-is-claimed-or-reserved)
- [Moderation und Kontosicherheit](/clawhub/moderation)
- [Sicherheit](/clawhub/security)
