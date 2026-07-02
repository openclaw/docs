---
read_when:
    - Beanspruchen einer Organisation, Marke, eines Paket-Scopes, Owner-Handles, Skill-Slugs oder Paket-Namespace
    - Auflösen eines Namensraums, der bereits beansprucht oder reserviert ist
    - Entscheidung, ob ein Bericht, ein Einspruch oder ein Namespace-Anspruch verwendet werden soll
sidebarTitle: Org and Namespace Claims
summary: So beantragen Sie eine ClawHub-Prüfung bei Streitfällen zur Eigentümerschaft von Organisation, Marke, Owner-Handle, Package-Scope, Skill-Slug oder Namespace.
title: Organisations- und Namespace-Ansprüche
x-i18n:
    generated_at: "2026-07-02T22:25:53Z"
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
realen Projekt, einer Marke, einem Paket-Ökosystem oder einer Organisation zu gehören scheint,
aber auf ClawHub bereits beansprucht, reserviert, irreführend oder umstritten ist, bitten Sie die Mitarbeitenden, ihn mit dem
[Issue-Formular für Organisations-/Namespace-Ansprüche](https://github.com/openclaw/clawhub/issues/new?template=org-namespace-claim.yml)
zu prüfen.

Nutzen Sie diesen Weg für öffentliche, nicht sensible Ownership-Prüfungen. Verwenden Sie keine produktinternen
Meldungen oder das Formular für Konto-Einsprüche für Namespace-Ansprüche.

## Wann Sie einen Anspruch eröffnen sollten

Eröffnen Sie einen Namespace-Anspruch, wenn Sie der Meinung sind, dass ClawHub-Mitarbeitende prüfen sollten, ob ein
Namespace aufgrund realer Ownership reserviert, übertragen, umbenannt, verborgen, quarantänisiert, aliasiert
oder anderweitig geändert werden sollte.

Beispiele sind:

- ein Organisations-Handle, das Ihrer GitHub-Organisation, Ihrem Projekt, Ihrem Unternehmen oder Ihrer Community entspricht
- ein Paket-Scope wie `@example-org/*`, das nur unter dem
  passenden ClawHub-Owner veröffentlichen sollte
- ein Skill-Slug oder Plugin-Paketname, der ein Projekt zu imitieren scheint
- eine Marke, ein Warenzeichen, eine Projektumbenennung oder ein Streit über die Pakethistorie
- ein gelöschter, inaktiver oder unerreichbarer Owner, der den rechtmäßigen Namespace-
  Owner blockiert

Wenn der Eintrag über den Ownership-Streit hinaus unsicher, bösartig oder irreführend ist,
befolgen Sie zusätzlich die relevante Moderations- oder Sicherheitsanleitung. Das Namespace-Anspruchsformular
dient der Ownership-Prüfung, nicht der Offenlegung von Notfall-Schwachstellen.

## Bevor Sie einreichen

Bestätigen Sie zuerst, dass Sie mit dem Owner veröffentlichen, der zum Namespace passt.
Für Plugin-Pakete müssen gescopte Namen wie `@example-org/example-plugin`
als passender `example-org`-Owner veröffentlicht werden.

Wenn Sie den aktuellen Owner verwalten können, beheben Sie den Namespace direkt durch Veröffentlichen,
Umbenennen, Übertragen, Verbergen oder Löschen der betroffenen Ressource. Verwenden Sie einen Anspruch,
wenn Sie den aktuellen Owner nicht verwalten können oder wenn Mitarbeitende einen Streit klären müssen.

## Belege, die Sie angeben sollten

Verwenden Sie öffentliche, nicht sensible Belege. Hilfreiche Nachweise sind:

- GitHub-Organisation, Repository, Release oder Maintainer-Historie
- offizielle Projektdokumentation, die den Namespace nennt
- Nachweis über Domain oder offizielle E-Mail-Domain
- Kontrolle über npm-, PyPI-, crates.io- oder andere Paketregistry-Scopes
- Nachweise zu Warenzeichen, Marke oder Projekt-Ownership, die öffentlich sicher besprochen werden können
- Quell-Repository-Historie, Pakethistorie oder öffentliche Hinweise zu Umbenennungen
- Links zum umstrittenen ClawHub-Owner, Skill, Plugin, Paket oder Issue

Erklären Sie, was jeder Link belegt. Mitarbeitende sollten die
Beziehung verstehen können, ohne private Zugangsdaten oder Secrets zu benötigen.

## Was Sie nicht angeben sollten

Veröffentlichen Sie keine Secrets oder privaten Nachweise in einem öffentlichen GitHub-Issue. Geben Sie Folgendes nicht an:

- API-Token, Signaturschlüssel oder Zugangsdaten
- DNS-Challenge-Token
- private Rechtsdokumente oder Verträge
- persönliche Ausweisdokumente
- private E-Mails, private Sicherheitsberichte oder vertrauliche Kundendaten

Das Anspruchsformular fragt, ob sensible Belege einen privaten Kanal zu den Mitarbeitenden benötigen.
Verwenden Sie diese Option, statt sensibles Material öffentlich zu posten.

## Mögliche Ergebnisse

Je nach Belegen und Risiko können ClawHub-Mitarbeitende einen Namespace reservieren,
Ownership übertragen, eine Ressource umbenennen, einen bestehenden Eintrag verbergen oder quarantänisieren,
einen Alias oder eine Weiterleitung hinzufügen, weitere Nachweise anfordern oder die Anfrage ablehnen.

Die Namespace-Prüfung garantiert nicht, dass jeder übereinstimmende Name übertragen wird.
Mitarbeitende wägen öffentliche Belege, bestehende Nutzung, Sicherheitsrisiko und Auswirkungen auf Nutzer ab.

## Verwandte Dokumentation

- [Veröffentlichen](/de/clawhub/publishing)
- [Fehlerbehebung](/clawhub/troubleshooting#publish-fails-because-a-namespace-is-claimed-or-reserved)
- [Moderation und Kontosicherheit](/clawhub/moderation)
- [Sicherheit](/clawhub/security)
