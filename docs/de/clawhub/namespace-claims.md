---
read_when:
    - Beanspruchen einer Organisation, Marke, eines Paket-Scopes, Inhaber-Handles, Skill-Slugs oder Paket-Namespace
    - Auflösen eines Namespace, der bereits beansprucht oder reserviert ist
    - Entscheiden, ob Sie eine Meldung, einen Einspruch oder einen Namespace-Anspruch verwenden
sidebarTitle: Org and Namespace Claims
summary: So fordern Sie eine ClawHub-Prüfung für Streitfälle zur Inhaberschaft von Organisationen, Marken, Owner-Handles, Package-Scopes, Skill-Slugs oder Namespaces an.
title: Organisations- und Namespace-Ansprüche
x-i18n:
    generated_at: "2026-07-03T13:23:04Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 77a4d8090b55298c401154d116d93d4f8139d40983a45982288d8e48bcea40fb
    source_path: clawhub/namespace-claims.md
    workflow: 16
---

# Organisations- und Namespace-Ansprüche

ClawHub verwendet Owner-Handles, Organisations-Handles, Skill-Slugs, Plugin-Paketnamen und
Paket-Scopes als öffentliche Namespaces. Wenn ein Namespace scheinbar zu einem
realen Projekt, einer Marke, einem Paket-Ökosystem oder einer Organisation gehört, aber auf
ClawHub bereits beansprucht, reserviert, irreführend oder umstritten ist, bitten Sie das Team um eine Prüfung über das
[Issue-Formular für Organisations-/Namespace-Ansprüche](https://github.com/openclaw/clawhub/issues/new?template=org-namespace-claim.yml).

Verwenden Sie diesen Weg für öffentliche, nicht sensible Eigentumsprüfungen. Verwenden Sie für Namespace-Ansprüche keine produktinternen
Meldungen und nicht das Formular für Konto-Einsprüche.

## Wann Sie einen Anspruch eröffnen sollten

Eröffnen Sie einen Namespace-Anspruch, wenn Sie der Ansicht sind, dass das ClawHub-Team prüfen sollte, ob ein
Namespace aufgrund realer Eigentumsverhältnisse reserviert, übertragen, umbenannt, ausgeblendet, unter Quarantäne gestellt, mit einem Alias versehen
oder anderweitig geändert werden sollte.

Beispiele sind:

- ein Organisations-Handle, das Ihrer GitHub-Organisation, Ihrem Projekt, Ihrem Unternehmen oder Ihrer Community entspricht
- ein Paket-Scope wie `@example-org/*`, der nur unter dem passenden
  ClawHub-Owner veröffentlichen sollte
- ein Skill-Slug oder Plugin-Paketname, der ein Projekt zu imitieren scheint
- ein Streit um eine Marke, ein Warenzeichen, eine Projektumbenennung oder eine Pakethistorie
- ein gelöschter, inaktiver oder unerreichbarer Owner, der den rechtmäßigen Namespace-
  Owner blockiert

Wenn der Eintrag über den Eigentumsstreit hinaus unsicher, bösartig oder irreführend ist,
befolgen Sie zusätzlich die relevante Moderations- oder Sicherheitsanleitung. Das Namespace-Anspruchsformular
dient der Eigentumsprüfung, nicht der Notfallmeldung von Schwachstellen.

## Bevor Sie einreichen

Bestätigen Sie zuerst, dass Sie mit dem Owner veröffentlichen, der zum Namespace passt.
Bei Plugin-Paketen müssen Scoped Names wie `@example-org/example-plugin` als
passender Owner `example-org` veröffentlicht werden.

Wenn Sie den aktuellen Owner verwalten können, korrigieren Sie den Namespace direkt durch Veröffentlichen,
Umbenennen, Übertragen, Ausblenden oder Löschen der betroffenen Ressource. Verwenden Sie einen Anspruch,
wenn Sie den aktuellen Owner nicht verwalten können oder wenn das Team einen
Streit klären muss.

## Einzubeziehende Nachweise

Verwenden Sie öffentliche, nicht sensible Nachweise. Hilfreiche Belege sind:

- GitHub-Organisation, Repository, Release- oder Maintainer-Historie
- offizielle Projektdokumentation, die den Namespace nennt
- Domain- oder offizieller E-Mail-Domain-Nachweis
- Kontrolle über npm-, PyPI-, crates.io- oder andere Paket-Registry-Scopes
- Nachweise zu Warenzeichen, Marke oder Projekteigentum, die öffentlich
  besprochen werden können
- Quell-Repository-Historie, Pakethistorie oder öffentliche Umbenennungshinweise
- Links zum umstrittenen ClawHub-Owner, Skill, Plugin, Paket oder Issue

Erklären Sie, was jeder Link belegt. Das Team sollte die
Beziehung verstehen können, ohne private Zugangsdaten oder Secrets zu benötigen.

## Was Sie nicht einbeziehen sollten

Veröffentlichen Sie keine Secrets oder privaten Nachweise in einem öffentlichen GitHub-Issue. Fügen Sie nicht hinzu:

- API-Tokens, Signierschlüssel oder Zugangsdaten
- DNS-Challenge-Tokens
- private Rechtsdokumente oder Verträge
- persönliche Identitätsdokumente
- private E-Mails, private Sicherheitsberichte oder vertrauliche Kundendaten

Das Anspruchsformular fragt, ob sensible Nachweise einen privaten Kanal zum Team benötigen.
Verwenden Sie diese Option, anstatt sensibles Material öffentlich zu posten.

## Mögliche Ergebnisse

Je nach Nachweis und Risiko kann das ClawHub-Team einen Namespace reservieren,
Eigentum übertragen, eine Ressource umbenennen, einen bestehenden Eintrag ausblenden oder unter Quarantäne stellen,
einen Alias oder eine Weiterleitung hinzufügen, weitere Nachweise anfordern oder die Anfrage ablehnen.

Eine Namespace-Prüfung garantiert nicht, dass jeder passende Name übertragen wird.
Das Team wägt öffentliche Nachweise, bestehende Nutzung, Sicherheitsrisiko und Auswirkungen auf Benutzer ab.

## Zugehörige Dokumentation

- [Veröffentlichen](/de/clawhub/publishing)
- [Fehlerbehebung](/clawhub/troubleshooting#publish-fails-because-a-namespace-is-claimed-or-reserved)
- [Moderation und Kontosicherheit](/clawhub/moderation)
- [Sicherheit](/clawhub/security)
