---
read_when:
    - Eine Organisation, Marke, einen Paket-Scope, Owner-Handle, Skill-Slug oder Paket-Namespace beanspruchen
    - Einen Namespace auflösen, der bereits beansprucht oder reserviert ist
    - Entscheidung, ob ein Bericht, ein Einspruch oder ein Namespace-Anspruch verwendet werden soll
sidebarTitle: Org and Namespace Claims
summary: So fordern Sie eine ClawHub-Prüfung bei Streitfällen um Organisations-, Marken-, Owner-Handle-, Package-Scope-, Skill-Slug- oder Namespace-Inhaberschaft an.
title: Organisations- und Namespace-Ansprüche
x-i18n:
    generated_at: "2026-07-02T14:01:10Z"
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
beansprucht, reserviert, irreführend oder umstritten ist, bitten Sie das Personal, ihn mit dem
[Issue-Formular für Organisations-/Namespace-Ansprüche](https://github.com/openclaw/clawhub/issues/new?template=org-namespace-claim.yml) zu prüfen.

Verwenden Sie diesen Weg für öffentliche, nicht sensible Ownership-Prüfungen. Verwenden Sie für Namespace-Ansprüche keine In-Product-
Meldungen oder das Formular für Konto-Einsprüche.

## Wann Sie einen Anspruch eröffnen sollten

Eröffnen Sie einen Namespace-Anspruch, wenn Sie der Meinung sind, dass ClawHub-Mitarbeitende prüfen sollten, ob ein
Namespace aufgrund realer Ownership reserviert, übertragen, umbenannt, ausgeblendet, unter Quarantäne gestellt, mit einem Alias versehen
oder anderweitig geändert werden sollte.

Beispiele:

- ein Organisations-Handle, das Ihrer GitHub-Organisation, Ihrem Projekt, Unternehmen oder Ihrer Community entspricht
- ein Paket-Scope wie `@example-org/*`, der nur unter dem
  passenden ClawHub-Owner veröffentlichen sollte
- ein Skill-Slug oder Plugin-Paketname, der ein Projekt zu imitieren scheint
- eine Marken-, Trademark-, Projektumbenennungs- oder Paketverlaufsstreitigkeit
- ein gelöschter, inaktiver oder nicht erreichbarer Owner, der den rechtmäßigen Namespace-
  Owner blockiert

Wenn der Eintrag über die Ownership-Streitigkeit hinaus unsicher, schädlich oder irreführend ist,
befolgen Sie zusätzlich die relevante Moderations- oder Sicherheitsanleitung. Das Namespace-Anspruchsformular
ist für Ownership-Prüfungen gedacht, nicht für die Notfall-Offenlegung von Sicherheitslücken.

## Vor dem Einreichen

Bestätigen Sie zunächst, dass Sie mit dem Owner veröffentlichen, der zum Namespace passt.
Für Plugin-Pakete müssen Scoped Names wie `@example-org/example-plugin` als der passende Owner `example-org`
veröffentlicht werden.

Wenn Sie den aktuellen Owner verwalten können, beheben Sie den Namespace direkt durch Veröffentlichen,
Umbenennen, Übertragen, Ausblenden oder Löschen der betroffenen Ressource. Verwenden Sie einen Anspruch,
wenn Sie den aktuellen Owner nicht verwalten können oder wenn Mitarbeitende eine
Streitigkeit lösen müssen.

## Beizufügende Nachweise

Verwenden Sie öffentliche, nicht sensible Nachweise. Hilfreiche Nachweise sind unter anderem:

- GitHub-Organisation, Repository, Release oder Maintainer-Verlauf
- offizielle Projektdokumentation, die den Namespace nennt
- Domain- oder offizieller E-Mail-Domain-Nachweis
- Kontrolle über npm-, PyPI-, crates.io- oder andere Paket-Registry-Scopes
- Trademark-, Marken- oder Projekt-Ownership-Nachweise, die öffentlich besprochen werden können
- Verlauf des Quell-Repositorys, Paketverlauf oder öffentliche Umbenennungshinweise
- Links zum umstrittenen ClawHub-Owner, Skill, Plugin, Paket oder Issue

Erläutern Sie, was jeder Link belegt. Mitarbeitende sollten die
Beziehung verstehen können, ohne private Anmeldedaten oder Geheimnisse zu benötigen.

## Was Sie nicht einschließen sollten

Veröffentlichen Sie keine Geheimnisse oder privaten Nachweise in einem öffentlichen GitHub-Issue. Schließen Sie Folgendes nicht ein:

- API-Token, Signaturschlüssel oder Anmeldedaten
- DNS-Challenge-Token
- private Rechtsdokumente oder Verträge
- persönliche Identitätsdokumente
- private E-Mails, private Sicherheitsberichte oder vertrauliche Kundendaten

Das Anspruchsformular fragt, ob sensible Nachweise einen privaten Kanal zu den Mitarbeitenden benötigen.
Verwenden Sie diese Option, statt sensibles Material öffentlich zu posten.

## Mögliche Ergebnisse

Je nach Nachweisen und Risiko können ClawHub-Mitarbeitende einen Namespace reservieren,
Ownership übertragen, eine Ressource umbenennen, einen vorhandenen Eintrag ausblenden oder unter Quarantäne stellen,
einen Alias oder eine Weiterleitung hinzufügen, weitere Nachweise anfordern oder die Anfrage ablehnen.

Eine Namespace-Prüfung garantiert nicht, dass jeder übereinstimmende Name übertragen wird.
Mitarbeitende wägen öffentliche Nachweise, bestehende Nutzung, Sicherheitsrisiken und Auswirkungen auf Benutzer ab.

## Verwandte Dokumentation

- [Veröffentlichen](/de/clawhub/publishing)
- [Fehlerbehebung](/clawhub/troubleshooting#publish-fails-because-a-namespace-is-claimed-or-reserved)
- [Moderation und Kontosicherheit](/clawhub/moderation)
- [Sicherheit](/clawhub/security)
