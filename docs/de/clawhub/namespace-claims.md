---
read_when:
    - Beanspruchen einer Organisation, Marke, eines Package-Scopes, Owner-Handles, Skill-Slugs oder Package-Namespace
    - Einen Namespace auflösen, der bereits beansprucht oder reserviert ist
    - Entscheidung, ob ein Bericht, ein Einspruch oder ein Namespace-Anspruch verwendet werden soll
sidebarTitle: Org and Namespace Claims
summary: So fordern Sie eine ClawHub-Prüfung für Streitfälle zur Inhaberschaft von Organisationen, Marken, Owner-Handles, Package-Scopes, Skill-Slugs oder Namespaces an.
title: Organisations- und Namespace-Ansprüche
x-i18n:
    generated_at: "2026-06-28T05:30:20Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 77a4d8090b55298c401154d116d93d4f8139d40983a45982288d8e48bcea40fb
    source_path: clawhub/namespace-claims.md
    workflow: 16
---

# Ansprüche auf Organisationen und Namespaces

ClawHub verwendet Owner-Handles, Org-Handles, Skill-Slugs, Plugin-Paketnamen und
Paket-Scopes als öffentliche Namespaces. Wenn ein Namespace zu einem realen
Projekt, einer Marke, einem Paket-Ökosystem oder einer Organisation zu gehören
scheint, auf ClawHub aber bereits beansprucht, reserviert, irreführend oder
umstritten ist, bitten Sie das Team, ihn über das
[Org- / Namespace-Anspruchsformular](https://github.com/openclaw/clawhub/issues/new?template=org-namespace-claim.yml)
zu prüfen.

Verwenden Sie diesen Weg für öffentliche, nicht sensible Eigentumsprüfungen.
Verwenden Sie keine produktinternen Meldungen oder das Konto-Einspruchsformular
für Namespace-Ansprüche.

## Wann Sie einen Anspruch eröffnen sollten

Eröffnen Sie einen Namespace-Anspruch, wenn Sie der Meinung sind, dass das
ClawHub-Team prüfen sollte, ob ein Namespace aufgrund realer Eigentumsverhältnisse
reserviert, übertragen, umbenannt, ausgeblendet, unter Quarantäne gestellt, mit
einem Alias versehen oder anderweitig geändert werden sollte.

Beispiele:

- ein Org-Handle, das Ihrer GitHub-Organisation, Ihrem Projekt, Ihrem Unternehmen
  oder Ihrer Community entspricht
- ein Paket-Scope wie `@example-org/*`, das nur unter dem passenden
  ClawHub-Owner veröffentlichen sollte
- ein Skill-Slug oder Plugin-Paketname, der ein Projekt nachzuahmen scheint
- ein Streit über eine Marke, ein Warenzeichen, eine Projektumbenennung oder eine
  Pakethistorie
- ein gelöschter, inaktiver oder nicht erreichbarer Owner, der den rechtmäßigen
  Namespace-Owner blockiert

Wenn der Eintrag über den Eigentumsstreit hinaus unsicher, bösartig oder
irreführend ist, befolgen Sie außerdem die einschlägigen Moderations- oder
Sicherheitsleitlinien. Das Namespace-Anspruchsformular dient der
Eigentumsprüfung, nicht der dringenden Offenlegung von Schwachstellen.

## Bevor Sie einreichen

Bestätigen Sie zuerst, dass Sie mit dem Owner veröffentlichen, der zum Namespace
passt. Bei Plugin-Paketen müssen scoped Namen wie `@example-org/example-plugin`
als passender Owner `example-org` veröffentlicht werden.

Wenn Sie den aktuellen Owner verwalten können, beheben Sie den Namespace direkt,
indem Sie die betroffene Ressource veröffentlichen, umbenennen, übertragen,
ausblenden oder löschen. Verwenden Sie einen Anspruch, wenn Sie den aktuellen
Owner nicht verwalten können oder wenn das Team einen Streitfall klären muss.

## Beizufügende Nachweise

Verwenden Sie öffentliche, nicht sensible Nachweise. Hilfreiche Belege sind:

- GitHub-Organisation, Repository, Release oder Maintainer-Historie
- offizielle Projektdokumentation, die den Namespace nennt
- Domain- oder offizieller E-Mail-Domain-Nachweis
- Kontrolle über npm-, PyPI-, crates.io- oder andere Paketregister-Scopes
- Marken-, Warenzeichen- oder Projekteigentumsnachweise, die öffentlich
  besprochen werden können
- Historie des Quell-Repositorys, Pakethistorie oder öffentliche
  Umbenennungshinweise
- Links zum umstrittenen ClawHub-Owner, Skill, Plugin, Paket oder Issue

Erklären Sie, was jeder Link belegt. Das Team sollte die Beziehung verstehen
können, ohne private Zugangsdaten oder Geheimnisse zu benötigen.

## Was Sie nicht einfügen sollten

Veröffentlichen Sie keine Geheimnisse oder privaten Nachweise in einem
öffentlichen GitHub-Issue. Fügen Sie Folgendes nicht ein:

- API-Tokens, Signierschlüssel oder Zugangsdaten
- DNS-Challenge-Tokens
- private Rechtsdokumente oder Verträge
- persönliche Ausweisdokumente
- private E-Mails, private Sicherheitsberichte oder vertrauliche Kundendaten

Das Anspruchsformular fragt, ob sensible Nachweise einen privaten Kanal zum Team
erfordern. Verwenden Sie diese Option, statt sensibles Material öffentlich zu
posten.

## Mögliche Ergebnisse

Je nach Nachweisen und Risiko kann das ClawHub-Team einen Namespace reservieren,
Eigentum übertragen, eine Ressource umbenennen, einen bestehenden Eintrag
ausblenden oder unter Quarantäne stellen, einen Alias oder eine Weiterleitung
hinzufügen, weitere Nachweise anfordern oder die Anfrage ablehnen.

Die Namespace-Prüfung garantiert nicht, dass jeder passende Name übertragen wird.
Das Team wägt öffentliche Nachweise, bestehende Nutzung, Sicherheitsrisiken und
Auswirkungen auf Benutzer ab.

## Verwandte Dokumentation

- [Veröffentlichen](/de/clawhub/publishing)
- [Fehlerbehebung](/de/clawhub/troubleshooting#publish-fails-because-a-namespace-is-claimed-or-reserved)
- [Moderation und Kontosicherheit](/de/clawhub/moderation)
- [Sicherheit](/de/clawhub/security)
