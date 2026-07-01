---
read_when:
    - Eine Organisation, Marke, einen Paket-Scope, Owner-Handle, Skill-Slug oder Paket-Namespace beanspruchen
    - Auflösen eines Namespaces, der bereits beansprucht oder reserviert ist
    - Entscheiden, ob ein Bericht, ein Einspruch oder ein Namespace-Anspruch verwendet werden soll
sidebarTitle: Org and Namespace Claims
summary: So fordern Sie eine ClawHub-Prüfung für Streitfälle zur Inhaberschaft von Organisationen, Marken, Owner-Handles, Package-Scopes, Skill-Slugs oder Namespaces an.
title: Org- und Namespace-Ansprüche
x-i18n:
    generated_at: "2026-07-01T20:16:11Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 77a4d8090b55298c401154d116d93d4f8139d40983a45982288d8e48bcea40fb
    source_path: clawhub/namespace-claims.md
    workflow: 16
---

# Org- und Namespace-Ansprüche

ClawHub verwendet Owner-Handles, Org-Handles, Skill-Slugs, Plugin-Paketnamen und
Paket-Scopes als öffentliche Namespaces. Wenn ein Namespace zu einem realen
Projekt, einer Marke, einem Paket-Ökosystem oder einer Organisation zu gehören
scheint, aber auf ClawHub bereits beansprucht, reserviert, irreführend oder
umstritten ist, bitten Sie das Team um Prüfung über das
[Issue-Formular für Org-/Namespace-Ansprüche](https://github.com/openclaw/clawhub/issues/new?template=org-namespace-claim.yml).

Verwenden Sie diesen Weg für öffentliche, nicht sensible Ownership-Prüfungen. Verwenden Sie für Namespace-Ansprüche keine produktinternen
Meldungen und nicht das Formular für Konto-Einsprüche.

## Wann Sie einen Anspruch eröffnen sollten

Eröffnen Sie einen Namespace-Anspruch, wenn Sie der Meinung sind, dass das
ClawHub-Team prüfen sollte, ob ein Namespace aufgrund realer Ownership
reserviert, übertragen, umbenannt, ausgeblendet, unter Quarantäne gestellt, mit
einem Alias versehen oder anderweitig geändert werden sollte.

Beispiele:

- ein Org-Handle, der Ihrer GitHub-Organisation, Ihrem Projekt, Unternehmen oder Ihrer Community entspricht
- ein Paket-Scope wie `@example-org/*`, der nur unter dem passenden
  ClawHub-Owner veröffentlichen sollte
- ein Skill-Slug oder Plugin-Paketname, der ein Projekt zu imitieren scheint
- ein Streitfall zu Marke, Warenzeichen, Projektumbenennung oder Pakethistorie
- ein gelöschter, inaktiver oder nicht erreichbarer Owner, der den rechtmäßigen
  Namespace-Owner blockiert

Wenn der Eintrag über den Ownership-Streit hinaus unsicher, bösartig oder
irreführend ist, befolgen Sie außerdem die relevante Moderations- oder
Sicherheitsanleitung. Das Formular für Namespace-Ansprüche dient der
Ownership-Prüfung, nicht der dringenden Offenlegung von Sicherheitslücken.

## Bevor Sie einreichen

Bestätigen Sie zuerst, dass Sie mit dem Owner veröffentlichen, der zum Namespace
passt. Für Plugin-Pakete müssen gescopte Namen wie `@example-org/example-plugin`
als passender Owner `example-org` veröffentlicht werden.

Wenn Sie den aktuellen Owner verwalten können, beheben Sie den Namespace direkt,
indem Sie die betroffene Ressource veröffentlichen, umbenennen, übertragen,
ausblenden oder löschen. Verwenden Sie einen Anspruch, wenn Sie den aktuellen
Owner nicht verwalten können oder wenn das Team einen Streitfall lösen muss.

## Einzuschließende Nachweise

Verwenden Sie öffentliche, nicht sensible Nachweise. Hilfreiche Belege sind:

- GitHub-Organisation, Repository, Release oder Maintainer-Historie
- offizielle Projektdokumentation, die den Namespace nennt
- Domain- oder offizieller E-Mail-Domain-Nachweis
- Kontrolle über Scopes in npm, PyPI, crates.io oder anderen Paket-Registries
- Nachweise zu Warenzeichen, Marke oder Projekt-Ownership, die öffentlich
  besprochen werden können
- Historie des Quell-Repositorys, Pakethistorie oder öffentliche Hinweise zur Umbenennung
- Links zum umstrittenen ClawHub-Owner, Skill, Plugin, Paket oder Issue

Erklären Sie, was jeder Link belegt. Das Team sollte die Beziehung verstehen
können, ohne private Zugangsdaten oder Geheimnisse zu benötigen.

## Was Sie nicht einschließen sollten

Stellen Sie keine Geheimnisse oder privaten Nachweise in ein öffentliches
GitHub-Issue. Schließen Sie Folgendes nicht ein:

- API-Tokens, Signaturschlüssel oder Zugangsdaten
- DNS-Challenge-Tokens
- private juristische Dateien oder Verträge
- persönliche Ausweisdokumente
- private E-Mails, private Sicherheitsberichte oder vertrauliche Kundendaten

Das Anspruchsformular fragt, ob sensible Nachweise einen privaten Kanal zum Team
benötigen. Verwenden Sie diese Option, statt sensibles Material öffentlich zu
posten.

## Mögliche Ergebnisse

Je nach Nachweisen und Risiko kann das ClawHub-Team einen Namespace reservieren,
Ownership übertragen, eine Ressource umbenennen, einen bestehenden Eintrag
ausblenden oder unter Quarantäne stellen, einen Alias oder eine Weiterleitung
hinzufügen, weitere Nachweise anfordern oder die Anfrage ablehnen.

Eine Namespace-Prüfung garantiert nicht, dass jeder passende Name übertragen
wird. Das Team wägt öffentliche Nachweise, bestehende Nutzung, Sicherheitsrisiko
und Auswirkungen auf Benutzer ab.

## Verwandte Dokumentation

- [Veröffentlichen](/de/clawhub/publishing)
- [Fehlerbehebung](/clawhub/troubleshooting#publish-fails-because-a-namespace-is-claimed-or-reserved)
- [Moderation und Kontosicherheit](/clawhub/moderation)
- [Sicherheit](/clawhub/security)
