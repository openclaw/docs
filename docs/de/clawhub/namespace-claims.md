---
read_when:
    - Eine Organisation, Marke, einen Paket-Scope, Owner-Handle, Skill-Slug oder Paket-Namespace beanspruchen
    - Auflösen eines bereits beanspruchten oder reservierten Namespace
    - Entscheiden, ob ein Bericht, eine Beschwerde oder ein Namespace-Anspruch verwendet werden soll
sidebarTitle: Org and Namespace Claims
summary: So fordern Sie eine ClawHub-Prüfung für Eigentumsstreitigkeiten zu Organisationen, Marken, Owner-Handles, Package-Scopes, Skill-Slugs oder Namespaces an.
title: Organisations- und Namespace-Ansprüche
x-i18n:
    generated_at: "2026-07-03T02:45:02Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 77a4d8090b55298c401154d116d93d4f8139d40983a45982288d8e48bcea40fb
    source_path: clawhub/namespace-claims.md
    workflow: 16
---

# Ansprüche auf Organisationen und Namensräume

ClawHub verwendet Owner-Handles, Org-Handles, Skill-Slugs, Plugin-Paketnamen und
Paket-Scopes als öffentliche Namensräume. Wenn ein Namensraum zu einem
realen Projekt, einer Marke, einem Paket-Ökosystem oder einer Organisation zu
gehören scheint, aber auf ClawHub bereits beansprucht, reserviert, irreführend
oder umstritten ist, bitten Sie das Team, ihn mit dem
[Issue-Formular für Org- / Namensraumansprüche](https://github.com/openclaw/clawhub/issues/new?template=org-namespace-claim.yml)
zu prüfen.

Verwenden Sie diesen Weg für öffentliche, nicht sensible Eigentumsprüfungen. Verwenden Sie keine produktinternen
Meldungen oder das Formular für Konto-Einsprüche für Namensraumansprüche.

## Wann Sie einen Anspruch einreichen sollten

Reichen Sie einen Namensraumanspruch ein, wenn Sie der Meinung sind, dass das
ClawHub-Team prüfen sollte, ob ein Namensraum aufgrund realer Eigentumsverhältnisse
reserviert, übertragen, umbenannt, ausgeblendet, unter Quarantäne gestellt, mit einem Alias versehen
oder anderweitig geändert werden sollte.

Beispiele sind:

- ein Org-Handle, das Ihrer GitHub-Organisation, Ihrem Projekt, Unternehmen oder Ihrer Community entspricht
- ein Paket-Scope wie `@example-org/*`, der nur unter dem
  passenden ClawHub-Owner veröffentlicht werden sollte
- ein Skill-Slug oder Plugin-Paketname, der ein Projekt zu imitieren scheint
- ein Streit um eine Marke, ein Warenzeichen, eine Projektumbenennung oder eine Pakethistorie
- ein gelöschter, inaktiver oder nicht erreichbarer Owner, der den rechtmäßigen
  Namensraum-Owner blockiert

Wenn der Eintrag über den Eigentumsstreit hinaus unsicher, bösartig oder irreführend ist,
befolgen Sie auch die relevante Moderations- oder Sicherheitsanleitung. Das Formular für Namensraumansprüche
dient der Eigentumsprüfung, nicht der dringenden Offenlegung von Schwachstellen.

## Bevor Sie einreichen

Bestätigen Sie zuerst, dass Sie mit dem Owner veröffentlichen, der zum Namensraum passt.
Bei Plugin-Paketen müssen Scoped-Namen wie `@example-org/example-plugin`
als passender `example-org`-Owner veröffentlicht werden.

Wenn Sie den aktuellen Owner verwalten können, beheben Sie den Namensraum direkt durch Veröffentlichen,
Umbenennen, Übertragen, Ausblenden oder Löschen der betroffenen Ressource. Reichen Sie einen Anspruch ein,
wenn Sie den aktuellen Owner nicht verwalten können oder wenn das Team einen
Streit klären muss.

## Beizufügende Nachweise

Verwenden Sie öffentliche, nicht sensible Nachweise. Hilfreiche Nachweise sind:

- GitHub-Org, Repository, Release oder Maintainer-Historie
- offizielle Projektdokumentation, die den Namensraum nennt
- Nachweise über Domain oder offizielle E-Mail-Domain
- Scope-Kontrolle in npm, PyPI, crates.io oder anderen Paket-Registrys
- Nachweise zu Warenzeichen, Marke oder Projekteigentum, die öffentlich
  besprochen werden können
- Historie des Quell-Repositorys, Pakethistorie oder öffentliche Hinweise zu Umbenennungen
- Links zum umstrittenen ClawHub-Owner, Skill, Plugin, Paket oder Issue

Erklären Sie, was jeder Link belegt. Das Team sollte die
Beziehung verstehen können, ohne private Zugangsdaten oder Secrets zu benötigen.

## Was Sie nicht angeben sollten

Veröffentlichen Sie keine Secrets oder privaten Nachweise in einem öffentlichen GitHub-Issue. Geben Sie nicht an:

- API-Tokens, Signaturschlüssel oder Zugangsdaten
- DNS-Challenge-Tokens
- private Rechtsdokumente oder Verträge
- persönliche Ausweisdokumente
- private E-Mails, private Sicherheitsberichte oder vertrauliche Kundendaten

Das Anspruchsformular fragt, ob sensible Nachweise einen privaten Team-Kanal benötigen.
Verwenden Sie diese Option, statt sensibles Material öffentlich zu posten.

## Mögliche Ergebnisse

Je nach Nachweisen und Risiko kann das ClawHub-Team einen Namensraum reservieren,
Eigentum übertragen, eine Ressource umbenennen, einen bestehenden Eintrag ausblenden oder unter Quarantäne stellen,
einen Alias oder eine Weiterleitung hinzufügen, weitere Nachweise anfordern oder die Anfrage ablehnen.

Die Namensraumprüfung garantiert nicht, dass jeder passende Name übertragen wird.
Das Team wägt öffentliche Nachweise, bestehende Nutzung, Sicherheitsrisiko und Auswirkungen auf Benutzer ab.

## Zugehörige Dokumentation

- [Veröffentlichen](/de/clawhub/publishing)
- [Fehlerbehebung](/clawhub/troubleshooting#publish-fails-because-a-namespace-is-claimed-or-reserved)
- [Moderation und Kontosicherheit](/clawhub/moderation)
- [Sicherheit](/clawhub/security)
