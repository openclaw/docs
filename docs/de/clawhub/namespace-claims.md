---
read_when:
    - Beanspruchen einer Organisation, Marke, eines Paket-Scopes, Owner-Handles, Skill-Slugs oder Paket-Namespace
    - Einen Namespace auflösen, der bereits beansprucht oder reserviert ist
    - Entscheiden, ob ein Bericht, ein Einspruch oder ein Namespace-Anspruch verwendet werden soll
sidebarTitle: Org and Namespace Claims
summary: So fordern Sie eine ClawHub-Überprüfung bei Streitigkeiten über die Eigentümerschaft von Organisationen, Marken, Owner-Handles, Package-Scopes, Skill-Slugs oder Namespaces an.
title: Organisations- und Namespace-Ansprüche
x-i18n:
    generated_at: "2026-07-01T15:21:50Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 77a4d8090b55298c401154d116d93d4f8139d40983a45982288d8e48bcea40fb
    source_path: clawhub/namespace-claims.md
    workflow: 16
---

# Ansprüche auf Organisationen und Namespaces

ClawHub verwendet Owner-Handles, Organisations-Handles, Skill-Slugs, Plugin-Paketnamen und
Paket-Scopes als öffentliche Namespaces. Wenn ein Namespace zu einem
realen Projekt, einer Marke, einem Paket-Ökosystem oder einer Organisation zu gehören scheint,
aber auf ClawHub bereits beansprucht, reserviert, irreführend oder umstritten ist, bitten Sie das Team, ihn mit dem
[Formular für Ansprüche auf Organisationen / Namespaces](https://github.com/openclaw/clawhub/issues/new?template=org-namespace-claim.yml)
zu prüfen.

Verwenden Sie diesen Weg für öffentliche, nicht sensible Ownership-Prüfungen. Verwenden Sie für
Namespace-Ansprüche keine In-Product-Meldungen oder das Formular für Konto-Einsprüche.

## Wann Sie einen Anspruch eröffnen sollten

Eröffnen Sie einen Namespace-Anspruch, wenn Sie der Meinung sind, dass das ClawHub-Team prüfen sollte, ob ein
Namespace aufgrund realer Ownership reserviert, übertragen, umbenannt, verborgen, quarantänisiert, mit einem Alias versehen
oder anderweitig geändert werden sollte.

Beispiele sind:

- ein Organisations-Handle, das Ihrer GitHub-Organisation, Ihrem Projekt, Unternehmen oder Ihrer Community entspricht
- ein Paket-Scope wie `@example-org/*`, unter dem nur der passende
  ClawHub-Owner veröffentlichen sollte
- ein Skill-Slug oder Plugin-Paketname, der ein Projekt zu imitieren scheint
- ein Streit um eine Marke, ein Warenzeichen, eine Projektumbenennung oder eine Pakethistorie
- ein gelöschter, inaktiver oder nicht erreichbarer Owner, der den rechtmäßigen Namespace-Owner blockiert

Wenn der Eintrag über den Ownership-Streit hinaus unsicher, bösartig oder irreführend ist,
befolgen Sie zusätzlich die relevanten Moderations- oder Sicherheitshinweise. Das Namespace-Anspruchsformular
dient der Ownership-Prüfung, nicht der Notfallmeldung von Schwachstellen.

## Bevor Sie einreichen

Bestätigen Sie zunächst, dass Sie mit dem Owner veröffentlichen, der zum Namespace passt.
Bei Plugin-Paketen müssen scoped Namen wie `@example-org/example-plugin` als
passender Owner `example-org` veröffentlicht werden.

Wenn Sie den aktuellen Owner verwalten können, beheben Sie den Namespace direkt durch Veröffentlichen,
Umbenennen, Übertragen, Verbergen oder Löschen der betroffenen Ressource. Verwenden Sie einen Anspruch,
wenn Sie den aktuellen Owner nicht verwalten können oder wenn das Team einen
Streit klären muss.

## Belege, die Sie angeben sollten

Verwenden Sie öffentliche, nicht sensible Belege. Hilfreiche Nachweise sind unter anderem:

- GitHub-Organisation, Repository, Release oder Maintainer-Historie
- offizielle Projektdokumentation, die den Namespace nennt
- Nachweis über Domain oder offizielle E-Mail-Domain
- Kontrolle über Scopes in npm, PyPI, crates.io oder anderen Paket-Registries
- Nachweise zu Warenzeichen, Marke oder Projekt-Ownership, die öffentlich besprochen werden können
- Verlauf des Quell-Repositorys, Pakethistorie oder öffentliche Hinweise auf Umbenennungen
- Links zum umstrittenen ClawHub-Owner, Skill, Plugin, Paket oder Issue

Erklären Sie, was jeder Link belegt. Das Team sollte die Beziehung verstehen können,
ohne private Anmeldedaten oder Geheimnisse zu benötigen.

## Was Sie nicht angeben sollten

Veröffentlichen Sie keine Geheimnisse oder privaten Nachweise in einem öffentlichen GitHub-Issue. Geben Sie nicht an:

- API-Tokens, Signaturschlüssel oder Anmeldedaten
- DNS-Challenge-Tokens
- private Rechtsdokumente oder Verträge
- persönliche Ausweisdokumente
- private E-Mails, private Sicherheitsberichte oder vertrauliche Kundendaten

Das Anspruchsformular fragt, ob sensible Belege einen privaten Kanal zum Team erfordern.
Verwenden Sie diese Option, statt sensibles Material öffentlich zu posten.

## Mögliche Ergebnisse

Je nach Belegen und Risiko kann das ClawHub-Team einen Namespace reservieren,
Ownership übertragen, eine Ressource umbenennen, einen bestehenden Eintrag verbergen oder quarantänisieren,
einen Alias oder eine Weiterleitung hinzufügen, weitere Nachweise anfordern oder die Anfrage ablehnen.

Die Namespace-Prüfung garantiert nicht, dass jeder passende Name übertragen wird.
Das Team wägt öffentliche Belege, bestehende Nutzung, Sicherheitsrisiko und Auswirkungen auf Benutzer ab.

## Verwandte Dokumentation

- [Veröffentlichen](/de/clawhub/publishing)
- [Fehlerbehebung](/clawhub/troubleshooting#publish-fails-because-a-namespace-is-claimed-or-reserved)
- [Moderation und Kontosicherheit](/clawhub/moderation)
- [Sicherheit](/clawhub/security)
