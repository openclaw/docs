---
read_when:
    - Beanspruchen einer Organisation, Marke, eines Paket-Scopes, Owner-Handles, Skill-Slugs oder Paket-Namespace
    - Beheben eines bereits beanspruchten oder reservierten Namespace
    - Entscheiden, ob ein Bericht, ein Einspruch oder ein Namespace-Anspruch verwendet werden soll
sidebarTitle: Org and Namespace Claims
summary: So beantragen Sie eine ClawHub-Prüfung bei Streitfällen zu Organisations-, Marken-, Owner-Handle-, Package-Scope-, Skill-Slug- oder Namespace-Eigentum.
title: Organisations- und Namespace-Ansprüche
x-i18n:
    generated_at: "2026-07-02T08:11:43Z"
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
beansprucht, reserviert, irreführend oder umstritten ist, bitten Sie das Team um Prüfung
über das
[Org- / Namespace-Anspruchsformular](https://github.com/openclaw/clawhub/issues/new?template=org-namespace-claim.yml).

Verwenden Sie diesen Weg für öffentliche, nicht sensible Ownership-Prüfungen. Verwenden Sie für Namespace-Ansprüche keine In-Product-
Meldungen oder das Formular für Konto-Einsprüche.

## Wann Sie einen Anspruch öffnen sollten

Öffnen Sie einen Namespace-Anspruch, wenn Sie der Meinung sind, dass das ClawHub-Team prüfen sollte, ob ein
Namespace aufgrund realer Ownership reserviert, übertragen, umbenannt, verborgen, unter Quarantäne gestellt, mit einem Alias versehen
oder anderweitig geändert werden sollte.

Beispiele sind:

- ein Organisations-Handle, das Ihrer GitHub-Organisation, Ihrem Projekt, Ihrem Unternehmen oder Ihrer Community entspricht
- ein Paket-Scope wie `@example-org/*`, der nur unter dem
  passenden ClawHub-Owner veröffentlichen sollte
- ein Skill-Slug oder Plugin-Paketname, der ein Projekt zu imitieren scheint
- ein Streitfall zu Marke, Warenzeichen, Projektumbenennung oder Pakethistorie
- ein gelöschter, inaktiver oder nicht erreichbarer Owner, der den rechtmäßigen Namespace-
  Owner blockiert

Wenn der Eintrag über den Ownership-Streit hinaus unsicher, bösartig oder irreführend ist,
befolgen Sie auch die relevante Moderations- oder Sicherheitsanleitung. Das Namespace-Anspruchsformular
ist für Ownership-Prüfungen gedacht, nicht für die Notfall-Offenlegung von Schwachstellen.

## Bevor Sie Einreichen

Bestätigen Sie zuerst, dass Sie mit dem Owner veröffentlichen, der zum Namespace passt.
Für Plugin-Pakete müssen gescopte Namen wie `@example-org/example-plugin`
als passender Owner `example-org` veröffentlicht werden.

Wenn Sie den aktuellen Owner verwalten können, korrigieren Sie den Namespace direkt durch Veröffentlichen,
Umbenennen, Übertragen, Verbergen oder Löschen der betroffenen Ressource. Verwenden Sie einen Anspruch,
wenn Sie den aktuellen Owner nicht verwalten können oder wenn das Team einen
Streitfall lösen muss.

## Einzubeziehende Nachweise

Verwenden Sie öffentliche, nicht sensible Nachweise. Hilfreiche Belege sind:

- GitHub-Organisation, Repository, Release- oder Maintainer-Historie
- offizielle Projektdokumentation, die den Namespace nennt
- Domain- oder offizieller E-Mail-Domain-Nachweis
- Kontrolle über npm-, PyPI-, crates.io- oder andere Paket-Registry-Scopes
- Nachweise zu Warenzeichen, Marke oder Projekt-Ownership, die sicher öffentlich
  besprochen werden können
- Quell-Repository-Historie, Pakethistorie oder öffentliche Umbenennungshinweise
- Links zum umstrittenen ClawHub-Owner, Skill, Plugin, Paket oder Issue

Erklären Sie, was jeder Link belegt. Das Team sollte die
Beziehung verstehen können, ohne private Zugangsdaten oder Geheimnisse zu benötigen.

## Was Sie nicht einbeziehen sollten

Veröffentlichen Sie keine Geheimnisse oder privaten Nachweise in einem öffentlichen GitHub-Issue. Fügen Sie nicht hinzu:

- API-Token, Signaturschlüssel oder Zugangsdaten
- DNS-Challenge-Token
- private Rechtsdokumente oder Verträge
- persönliche Ausweisdokumente
- private E-Mails, private Sicherheitsberichte oder vertrauliche Kundendaten

Das Anspruchsformular fragt, ob sensible Nachweise einen privaten Kanal zum Team benötigen.
Verwenden Sie diese Option, anstatt sensibles Material öffentlich zu posten.

## Mögliche Ergebnisse

Je nach Nachweisen und Risiko kann das ClawHub-Team einen Namespace reservieren,
Ownership übertragen, eine Ressource umbenennen, einen bestehenden Eintrag verbergen oder unter Quarantäne stellen,
einen Alias oder eine Weiterleitung hinzufügen, weitere Nachweise anfordern oder die Anfrage ablehnen.

Die Namespace-Prüfung garantiert nicht, dass jeder übereinstimmende Name übertragen wird.
Das Team wägt öffentliche Nachweise, bestehende Nutzung, Sicherheitsrisiko und Auswirkungen auf Benutzer ab.

## Zugehörige Dokumentation

- [Veröffentlichen](/de/clawhub/publishing)
- [Fehlerbehebung](/clawhub/troubleshooting#publish-fails-because-a-namespace-is-claimed-or-reserved)
- [Moderation und Kontosicherheit](/clawhub/moderation)
- [Sicherheit](/clawhub/security)
