---
read_when:
    - Beanspruchen einer Organisation, Marke, eines Paket-Scopes, Owner-Handles, Skill-Slugs oder Paket-Namespace
    - Auflösen eines Namespace, der bereits beansprucht oder reserviert ist
    - Entscheiden, ob ein Bericht, Einspruch oder Namespace-Anspruch verwendet werden soll
sidebarTitle: Org and Namespace Claims
summary: So beantragen Sie eine ClawHub-Prüfung bei Streitfällen zur Eigentümerschaft von Organisation, Marke, Owner-Handle, Package-Scope, Skill-Slug oder Namespace.
title: Organisations- und Namespace-Ansprüche
x-i18n:
    generated_at: "2026-07-01T05:33:37Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 77a4d8090b55298c401154d116d93d4f8139d40983a45982288d8e48bcea40fb
    source_path: clawhub/namespace-claims.md
    workflow: 16
---

# Organisations- und Namespace-Ansprüche

ClawHub verwendet Owner-Handles, Org-Handles, Skill-Slugs, Plugin-Paketnamen und
Paket-Scopes als öffentliche Namespaces. Wenn ein Namespace zu einem realen
Projekt, einer Marke, einem Paket-Ökosystem oder einer Organisation zu gehören
scheint, aber auf ClawHub bereits beansprucht, reserviert, irreführend oder
umstritten ist, bitten Sie das Team, ihn mit dem
[Issue-Formular für Organisations- / Namespace-Ansprüche](https://github.com/openclaw/clawhub/issues/new?template=org-namespace-claim.yml)
zu prüfen.

Verwenden Sie diesen Weg für öffentliche, nicht sensible Ownership-Prüfungen.
Verwenden Sie für Namespace-Ansprüche keine Meldungen im Produkt und nicht das
Formular für Konto-Einsprüche.

## Wann Sie einen Anspruch öffnen sollten

Öffnen Sie einen Namespace-Anspruch, wenn Sie der Meinung sind, dass das
ClawHub-Team prüfen sollte, ob ein Namespace aufgrund realer Ownership reserviert,
übertragen, umbenannt, ausgeblendet, unter Quarantäne gestellt, mit einem Alias
versehen oder anderweitig geändert werden sollte.

Beispiele:

- ein Org-Handle, das Ihrer GitHub-Organisation, Ihrem Projekt, Unternehmen oder
  Ihrer Community entspricht
- ein Paket-Scope wie `@example-org/*`, das nur unter dem passenden ClawHub-Owner
  veröffentlichen sollte
- ein Skill-Slug oder Plugin-Paketname, der ein Projekt nachzuahmen scheint
- eine Streitigkeit zu Marke, Warenzeichen, Projektumbenennung oder Pakethistorie
- ein gelöschter, inaktiver oder nicht erreichbarer Owner, der den rechtmäßigen
  Namespace-Owner blockiert

Wenn der Eintrag über den Ownership-Streit hinaus unsicher, bösartig oder
irreführend ist, befolgen Sie außerdem die relevante Moderations- oder
Sicherheitsanleitung. Das Formular für Namespace-Ansprüche ist für
Ownership-Prüfungen gedacht, nicht für die Offenlegung akuter Schwachstellen.

## Bevor Sie einreichen

Bestätigen Sie zuerst, dass Sie mit dem Owner veröffentlichen, der zum Namespace
passt. Für Plugin-Pakete müssen gescopte Namen wie
`@example-org/example-plugin` als passender Owner `example-org` veröffentlicht
werden.

Wenn Sie den aktuellen Owner verwalten können, beheben Sie den Namespace direkt,
indem Sie die betroffene Ressource veröffentlichen, umbenennen, übertragen,
ausblenden oder löschen. Verwenden Sie einen Anspruch, wenn Sie den aktuellen
Owner nicht verwalten können oder wenn das Team eine Streitigkeit lösen muss.

## Beizufügende Nachweise

Verwenden Sie öffentliche, nicht sensible Nachweise. Hilfreiche Nachweise sind:

- GitHub-Organisation, Repository, Release- oder Maintainer-Historie
- offizielle Projektdokumentation, die den Namespace nennt
- Domain- oder offizieller E-Mail-Domain-Nachweis
- Kontrolle über npm-, PyPI-, crates.io- oder andere Paket-Registry-Scopes
- Warenzeichen-, Marken- oder Projekt-Ownership-Nachweise, die öffentlich
  besprochen werden können
- Quell-Repository-Historie, Pakethistorie oder öffentliche Hinweise zu
  Umbenennungen
- Links zum umstrittenen ClawHub-Owner, Skill, Plugin, Paket oder Issue

Erklären Sie, was jeder Link belegt. Das Team sollte die Beziehung verstehen
können, ohne private Zugangsdaten oder Secrets zu benötigen.

## Was Sie nicht beifügen sollten

Stellen Sie keine Secrets oder privaten Nachweise in ein öffentliches
GitHub-Issue. Fügen Sie Folgendes nicht bei:

- API-Tokens, Signaturschlüssel oder Zugangsdaten
- DNS-Challenge-Tokens
- private Rechtsdokumente oder Verträge
- persönliche Ausweisdokumente
- private E-Mails, private Sicherheitsberichte oder vertrauliche Kundendaten

Das Anspruchsformular fragt, ob sensible Nachweise einen privaten Kanal zum Team
benötigen. Verwenden Sie diese Option, statt sensibles Material öffentlich zu
posten.

## Mögliche Ergebnisse

Abhängig von Nachweisen und Risiko kann das ClawHub-Team einen Namespace
reservieren, Ownership übertragen, eine Ressource umbenennen, einen bestehenden
Eintrag ausblenden oder unter Quarantäne stellen, einen Alias oder eine
Weiterleitung hinzufügen, weitere Nachweise anfordern oder die Anfrage ablehnen.

Die Namespace-Prüfung garantiert nicht, dass jeder passende Name übertragen wird.
Das Team gewichtet öffentliche Nachweise, bestehende Nutzung, Sicherheitsrisiko
und Auswirkungen auf Benutzer.

## Verwandte Dokumentation

- [Veröffentlichen](/de/clawhub/publishing)
- [Problembehandlung](/clawhub/troubleshooting#publish-fails-because-a-namespace-is-claimed-or-reserved)
- [Moderation und Kontosicherheit](/clawhub/moderation)
- [Sicherheit](/clawhub/security)
