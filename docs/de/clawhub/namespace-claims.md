---
read_when:
    - Beanspruchen einer Organisation, Marke, eines Paket-Scopes, Owner-Handles, Skill-Slugs oder Paket-Namespace
    - Auflösen eines Namespace, der bereits beansprucht oder reserviert ist
    - Entscheiden, ob ein Bericht, ein Einspruch oder ein Namespace-Anspruch verwendet werden soll
sidebarTitle: Org and Namespace Claims
summary: So beantragen Sie eine ClawHub-Prüfung bei Streitfällen zur Inhaberschaft von Organisationen, Marken, Owner-Handles, Package-Scopes, Skill-Slugs oder Namespaces.
title: Organisations- und Namespace-Ansprüche
x-i18n:
    generated_at: "2026-07-04T03:41:11Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 77a4d8090b55298c401154d116d93d4f8139d40983a45982288d8e48bcea40fb
    source_path: clawhub/namespace-claims.md
    workflow: 16
---

# Org- und Namespace-Ansprüche

ClawHub verwendet Owner-Handles, Org-Handles, Skill-Slugs, Plugin-Paketnamen und
Paket-Scopes als öffentliche Namespaces. Wenn ein Namespace offenbar zu einem
realen Projekt, einer Marke, einem Paket-Ökosystem oder einer Organisation
gehört, aber auf ClawHub bereits beansprucht, reserviert, irreführend oder
umstritten ist, bitten Sie das Personal, ihn mit dem
[Org-/Namespace-Anspruchsformular](https://github.com/openclaw/clawhub/issues/new?template=org-namespace-claim.yml)
zu prüfen.

Verwenden Sie diesen Weg für öffentliche, nicht sensible Eigentumsprüfungen.
Verwenden Sie für Namespace-Ansprüche keine In-Product-Meldungen oder das
Formular für Konto-Einsprüche.

## Wann Sie einen Anspruch eröffnen sollten

Eröffnen Sie einen Namespace-Anspruch, wenn Sie der Meinung sind, dass das
ClawHub-Personal prüfen sollte, ob ein Namespace aufgrund realer Eigentumsverhältnisse
reserviert, übertragen, umbenannt, ausgeblendet, unter Quarantäne gestellt, mit
einem Alias versehen oder anderweitig geändert werden sollte.

Beispiele sind:

- ein Org-Handle, das Ihrer GitHub-Org, Ihrem Projekt, Ihrem Unternehmen oder
  Ihrer Community entspricht
- ein Paket-Scope wie `@example-org/*`, unter dem nur der passende
  ClawHub-Owner veröffentlichen sollte
- ein Skill-Slug oder Plugin-Paketname, der offenbar ein Projekt imitiert
- ein Streitfall zu Marke, Warenzeichen, Projektumbenennung oder Pakethistorie
- ein gelöschter, inaktiver oder nicht erreichbarer Owner, der den rechtmäßigen
  Namespace-Owner blockiert

Wenn der Eintrag über den Eigentumsstreit hinaus unsicher, bösartig oder
irreführend ist, befolgen Sie außerdem die einschlägigen Moderations- oder
Sicherheitshinweise. Das Namespace-Anspruchsformular dient der Eigentumsprüfung,
nicht der Notfallmeldung von Schwachstellen.

## Bevor Sie einreichen

Bestätigen Sie zuerst, dass Sie mit dem Owner veröffentlichen, der zum Namespace
passt. Für Plugin-Pakete müssen scoped Namen wie `@example-org/example-plugin`
als passender Owner `example-org` veröffentlicht werden.

Wenn Sie den aktuellen Owner verwalten können, beheben Sie den Namespace direkt,
indem Sie die betroffene Ressource veröffentlichen, umbenennen, übertragen,
ausblenden oder löschen. Verwenden Sie einen Anspruch, wenn Sie den aktuellen
Owner nicht verwalten können oder wenn das Personal einen Streitfall lösen muss.

## Einzuschließende Nachweise

Verwenden Sie öffentliche, nicht sensible Nachweise. Hilfreiche Belege sind:

- GitHub-Org-, Repository-, Release- oder Maintainer-Historie
- offizielle Projektdokumentation, die den Namespace nennt
- Domain- oder offizieller E-Mail-Domain-Nachweis
- Kontrolle über Scopes in npm, PyPI, crates.io oder anderen Paket-Registries
- Nachweise zu Warenzeichen, Marke oder Projekteigentum, die öffentlich
  besprochen werden können
- Quell-Repository-Historie, Pakethistorie oder öffentliche Hinweise zu
  Umbenennungen
- Links zum umstrittenen ClawHub-Owner, Skill, Plugin, Paket oder Issue

Erklären Sie, was jeder Link belegt. Das Personal sollte die Beziehung verstehen
können, ohne private Zugangsdaten oder Geheimnisse zu benötigen.

## Was Sie nicht einschließen sollten

Stellen Sie keine Geheimnisse oder privaten Nachweise in ein öffentliches
GitHub-Issue. Fügen Sie Folgendes nicht ein:

- API-Token, Signierschlüssel oder Zugangsdaten
- DNS-Challenge-Token
- private juristische Unterlagen oder Verträge
- persönliche Ausweisdokumente
- private E-Mails, private Sicherheitsberichte oder vertrauliche Kundendaten

Das Anspruchsformular fragt, ob sensible Nachweise einen privaten Kanal zum
Personal benötigen. Verwenden Sie diese Option, statt sensibles Material
öffentlich zu posten.

## Mögliche Ergebnisse

Je nach Nachweisen und Risiko kann das ClawHub-Personal einen Namespace
reservieren, Eigentum übertragen, eine Ressource umbenennen, einen bestehenden
Eintrag ausblenden oder unter Quarantäne stellen, einen Alias oder eine
Weiterleitung hinzufügen, weitere Nachweise anfordern oder die Anfrage ablehnen.

Eine Namespace-Prüfung garantiert nicht, dass jeder passende Name übertragen
wird. Das Personal wägt öffentliche Nachweise, bestehende Nutzung,
Sicherheitsrisiken und Auswirkungen auf Benutzer ab.

## Verwandte Dokumentation

- [Veröffentlichen](/de/clawhub/publishing)
- [Fehlerbehebung](/clawhub/troubleshooting#publish-fails-because-a-namespace-is-claimed-or-reserved)
- [Moderation und Kontosicherheit](/clawhub/moderation)
- [Sicherheit](/clawhub/security)
