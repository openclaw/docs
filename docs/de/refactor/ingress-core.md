---
read_when:
    - Untersuchung, warum das Refactoring des Channel-Ingress zu viel Code hinzugefügt hat
    - Verschieben von Routen-, Befehls-, Ereignis-, Aktivierungs- oder Zugriffsgruppenrichtlinien aus gebündelten Plugins in den Kern
    - Prüfung, ob eine Hilfsfunktion für den Kanal-Ingress tatsächlich gebündelten Plugin-Code löscht
sidebarTitle: Ingress core deletion
summary: Löschungsorientierter Plan zum Verschieben wiederholter Kanaleingangs-Verknüpfungslogik in den Kern.
title: Plan zur Entfernung des Ingress-Kerns
x-i18n:
    generated_at: "2026-05-10T19:50:49Z"
    model: gpt-5.5
    provider: openai
    source_hash: 71afcf5d4f58c57ecfe7b388325279700a723ec1fcd926f644095106b662c3d0
    source_path: refactor/ingress-core.md
    workflow: 16
---

# Plan zur Löschung des Ingress-Core

Der Ingress-Refactor ist nicht gesund, solange er netto Tausende Zeilen
hinzufügt. Core-Zentralisierung zählt nur, wenn der Produktionscode gebündelter
Plugins kleiner wird und alte Drittanbieter-SDK-Kompatibilität auf SDK-/Core-Shims
isoliert wird.

Gewünschte Laufzeitstruktur:

```text
bundled plugin event
  -> extract platform facts locally
  -> resolve shared ingress once when facts are available
  -> branch on generic ingress projections/outcomes
  -> perform platform side effects locally

old third-party helper
  -> SDK compatibility shim
  -> shared ingress-compatible projection where possible
  -> old return shape preserved
```

Gebündelte Plugins sollten Ingress nicht zurück in lokale `AccessResult`-,
`GroupAccessDecision`-, `CommandAuthDecision`-, `DmCommandAccess`- oder
`{ allowed, reasonCode }`-Formen übersetzen, außer dieser Typ ist öffentliche
Plugin-API.

## Budget

Gemessen gegen die PR-Merge-Base mit `origin/main`, einschließlich nicht
nachverfolgter Dateien.

```text
merge-base            1671e7532adb

current:
core production       +3,922 / -546    = +3,376
docs                  +601 / -17       = +584
other                 +145 / -2        = +143
plugin production     +4,148 / -5,388  = -1,240
tests                 +2,326 / -2,414  = -88
total                 +11,142 / -8,367 = +2,775

required:
plugin production     <= -1,500
core production       <= +1,500, or paid for by larger plugin deletion
tests                 <= +1,000
total                 <= +2,000

stretch:
plugin production     <= -2,500
core production       <= +1,200
total                 <= 0
```

Mindestens verbleibende Bereinigung:

```text
plugin production     needs 260 more net deleted lines
total                 needs 775 more net deleted lines
core production       still +1,876 over standalone budget, unless paid down by plugin deletion
```

Nur Kommentare zu löschen zählt nicht als Bereinigung. Der vorige Budgetdurchlauf
war zu großzügig, weil er wiederhergestellte erklärende QQBot-Kommentare
einschloss; dieses Dokument verfolgt nur die Bewegung von ausführbarem Code,
Dokumentation und Testcode.

Nach jeder Bereinigungswelle erneut messen:

```sh
base=$(git merge-base HEAD origin/main)
git diff --shortstat "$base"
git diff --numstat "$base" -- src/channels/message-access src/plugin-sdk extensions | sort -nr -k1 | head -n 80
pnpm lint:extensions:no-deprecated-channel-access
```

## Diagnose

Der erste Durchlauf fügte den gemeinsamen Ingress-Kernel hinzu und ließ dann zu
viel Plugin-lokale Autorisierung daneben bestehen:

```text
platform facts
  -> shared ingress state and decision
  -> plugin-local DTO or legacy projection
  -> plugin-local if/else ladder
```

Das dupliziert das Modell. Core-Produktionscode ist um etwa 3.376 Zeilen
gewachsen, während der Produktionscode gebündelter Plugins 1.240 Zeilen kleiner
ist. Das ist besser als der erste Durchlauf, liegt aber nicht innerhalb des
Mindestbudgets. Die Korrektur bleibt löschungsorientiert:

- Plugin-DTOs löschen, die nur Ingress-Felder umbenennen
- Tests löschen, die nur Wrapper-Formen prüfen
- Core-Helfer nur hinzufügen, wenn derselbe Patch gebündelten Plugin-Code löscht
- alte SDK-Kompatibilität nur in SDK-/Core-Shims halten
- Core neu packen, nachdem die Wrapper-Löschung die stabile Form freigelegt hat

## Hotspots

Positive gebündelte Produktionsdateien, die noch schrumpfen müssen:

```text
extensions/telegram/src/ingress.ts                        +126
extensions/discord/src/monitor/dm-command-auth.ts         +101
extensions/signal/src/monitor/access-policy.ts             +92
extensions/feishu/src/policy.ts                            +85
extensions/slack/src/monitor/auth.ts                       +64
extensions/googlechat/src/monitor-access.ts                +59
extensions/nextcloud-talk/src/inbound.ts                   +51
extensions/matrix/src/matrix/monitor/access-state.ts       +49
extensions/irc/src/inbound.ts                              +44
extensions/imessage/src/monitor/inbound-processing.ts      +36
extensions/qa-channel/src/inbound.ts                       +34
extensions/qqbot/src/bridge/sdk-adapter.ts                 +33
extensions/tlon/src/monitor/utils.ts                       +30
extensions/twitch/src/access-control.ts                    +22
extensions/qqbot/src/engine/commands/slash-command-handler.ts +20
extensions/telegram/src/bot-handlers.runtime.ts            +19
```

Der Branch liegt noch nicht innerhalb des Mindestbudgets. Die verbleibende
review-relevante Arbeit sollte wiederholten Autorisierungsfluss, Turn-Gerüst oder
Wrapper-Tests löschen, bevor eine weitere Core-Abstraktion hinzugefügt wird.

## Aktueller Codebefund

Die gesunde Core-Nahtstelle existiert bereits in `src/channels/message-access/runtime.ts`:
Sie besitzt Identitätsadapter, effektive Allowlists, Pairing-Store-Lesezugriffe,
Routenbeschreibungen, Command-/Event-Presets, Zugriffsgruppen und die finale
aufgelöste Projektion `ResolvedChannelMessageIngress`.

Das verbleibende Wachstum ist überwiegend Plugin-Glue, der auf diese Nahtstelle
geschichtet ist:

- `extensions/telegram/src/ingress.ts` kapselt Core-Entscheidungen in
  Telegram-spezifischen Command-/Event-Helfern, und Call-Sites übergeben dennoch
  vorab berechnete normalisierte Allowlists und Owner-Listen.
- `extensions/discord/src/monitor/dm-command-auth.ts`,
  `extensions/feishu/src/policy.ts`, `extensions/googlechat/src/monitor-access.ts`
  und `extensions/matrix/src/matrix/monitor/access-state.ts` behalten weiterhin
  lokale Policy-DTOs oder Legacy-Entscheidungsnamen neben Ingress.
- `extensions/signal/src/monitor/access-policy.ts` behält Signal-spezifische
  Identitätsnormalisierung und Pairing-Antworten korrekt lokal, hat aber noch
  eine Wrapper-Nahtstelle, die in direkten Ingress-Konsum zusammenfallen sollte.
- `extensions/nextcloud-talk/src/inbound.ts`, `extensions/irc/src/inbound.ts`,
  `extensions/qa-channel/src/inbound.ts`, `extensions/zalo/src/monitor.ts` und
  `extensions/zalouser/src/monitor.ts` wiederholen weiterhin Routen-/Envelope-/
  Turn-Aufbau, der in gemeinsame Turn-Helfer außerhalb des Ingress-Kernels
  verschoben werden kann.

Fazit: Mehr Code in den Core zu verschieben ist nur dann nützlich, wenn es diese
Plugin-Wrapper-Schichten im selben Patch löscht. Eine weitere Abstraktion
hinzuzufügen, während Wrapper-Rückgaben bestehen bleiben, wiederholt den Fehler.

## Grenze

Core besitzt generische Policy:

- Allowlist-Normalisierung und -Abgleich
- Zugriffsgruppenerweiterung und Diagnose
- Pairing-Store-Lesezugriffe für DM-Allowlists
- Routen-, Sender-, Command-, Event- und Aktivierungsgates
- Zulassungs-Mapping: Dispatch, Drop, Skip, Observe, Pairing
- redigierter Zustand, Entscheidungen, Diagnosen und SDK-Kompatibilitätsprojektionen
- wiederverwendbare generische Beschreibungen für Identität, Route, Command,
  Event, Aktivierung und Ergebnisse

Plugins besitzen Transportfakten und Seiteneffekte:

- Webhook-/Socket-/Request-Authentizität
- Plattform-Identitätsextraktion und API-Lookups
- channelspezifische Policy-Defaults
- Pairing-Challenge-Zustellung, Antworten, Acks, Reaktionen, Tippen, Medien,
  Verlauf, Einrichtung, Doctor, Status, Logs und nutzerorientierte Texte

Core muss channel-agnostisch bleiben: kein Discord, Slack, Telegram, Matrix,
Room, Guild, Space, API-Client oder Plugin-spezifischer Default in
`src/channels/message-access`.

## Akzeptanzregel

Jeder neue Core-Helfer muss sofort Produktionscode gebündelter Plugins löschen.

```text
one bundled caller        reject; keep plugin-local
two bundled callers       accept only if plugin production LOC drops
three or more callers     plugin deletion must be at least 2x new core LOC
compatibility-only helper SDK/core shim only; never bundled hot paths
```

Stoppen und neu entwerfen, wenn:

- Produktions-LOC von Plugins steigen
- Tests schneller wachsen, als Produktion schrumpft
- ein gebündelter Hot Path ein DTO zurückgibt, das nur
  `ResolvedChannelMessageIngress` umbenennt
- ein Core-Helfer eine Channel-ID, ein Plattformobjekt, einen API-Client oder
  einen channelspezifischen Default benötigt

## Arbeitspakete

1. Das Budget einfrieren.
   LOC in den PR aufnehmen, Deprecated-Ingress-Lint grün halten und Vorher-/Nachher-
   LOC in Bereinigungs-Commits einschließen.

2. Dünne DTO-Nahtstellen löschen.
   Plugin-lokale Wrapper-Rückgaben durch direkte Verwendung von
   `ResolvedChannelMessageIngress`, `senderAccess`, `commandAccess`, `routeAccess`
   oder `ingress` ersetzen. Mit QQBot, Telegram, Slack, Discord, Signal, Feishu,
   Matrix, iMessage und Tlon beginnen. Wrapper-Form-Tests löschen; Verhaltenstests
   behalten.

3. Ergebnis-Klassifizierung nur mit Löschungen hinzufügen.
   Ein generischer Klassifizierer kann `dispatch`, `pairing-required`,
   `skip-activation`, `drop-command`, `drop-route`, `drop-sender` und
   `drop-ingress` bereitstellen. Er muss aus dem Entscheidungsgraphen abgeleitet
   werden, nicht aus Reason-Strings, und im selben Patch mindestens drei Plugins
   migrieren.

4. Routenbeschreibungs-Builder nur mit Löschungen hinzufügen.
   Generische Helfer für Routenziel und Routensender sind nur akzeptabel, wenn sie
   routenlastige Plugins sofort verkleinern: Google Chat, IRC, Microsoft Teams,
   Nextcloud Talk, Mattermost, Slack, Zalo und Zalo Personal.

5. Command-/Event-Presets nur mit Löschungen hinzufügen.
   Text-Command-, Native-Command-, Callback- und Origin-Subject-Formen
   zentralisieren. Command-Consumer müssen standardmäßig nicht autorisiert sein,
   wenn kein Command-Gate lief; Events dürfen kein Pairing starten.

6. Identitäts-Presets nur hinzufügen, wo sie Boilerplate entfernen.
   Helfer für stabile ID, stabile ID plus Aliase, Telefon/E.164 und mehrere
   Identifikatoren sind zulässig, wenn Rohwerte nur in Adapter-Eingaben eingehen
   und der redigierte Zustand opake IDs/Zählungen behält.

7. Autorisierten Turn-Aufbau teilen.
   Außerhalb des Ingress-Kernels wiederholtes Routen-/Session-/Envelope-/Context-/
   Reply-Gerüst aus QA Channel, IRC, Nextcloud Talk, Zalo und Zalo Personal
   entfernen. Core darf Routen-/Session-/Envelope-/Dispatch-Sequenzierung besitzen;
   Plugins behalten Zustellung und channelspezifischen Kontext.

8. Kompatibilität isolieren.
   Veraltete SDK-Helfer bleiben quellkompatibel, aber gebündelte Hot Paths dürfen
   keine veralteten Ingress- oder Command-Auth-Fassaden importieren.
   Kompatibilitätstests sollten gefälschte Drittanbieter-Plugins verwenden, nicht
   Interna gebündelter Plugins.

9. Core neu packen.
   Nach der Wrapper-Löschung Einmal-Module zusammenlegen, ungenutzte Exporte
   entfernen, Kompatibilitätsprojektion aus Hot Paths verschieben und fokussierte
   Tests für Identität, Route, Command/Event, Aktivierung, Zugriffsgruppen und
   Kompatibilitäts-Shims behalten.

## Löschwellen

In dieser Reihenfolge ausführen. Jede Welle muss die Produktions-LOC gebündelter
Plugins senken.

1. Wrapper-Kollaps, erwartetes Plugin-Delta: -400 bis -600.
   Plugin-lokale `resolveXAccess`-, `resolveXCommandAccess`- und
   `accessFromIngress`-Ergebnistypen durch direkte Zugriffe auf
   `ResolvedChannelMessageIngress` ersetzen. Erste Ziele: Discord-DM-Command-Auth,
   Feishu-Policy, Matrix-Zugriffsstatus, Telegram-Ingress, Signal-Zugriffs-Policy,
   QQBot-SDK-Adapter.

2. Geteilte Ergebnishelfer, erwartetes Plugin-Delta: -200 bis -350.
   Einen generischen Klassifizierer nur hinzufügen, wenn er wiederholte
   `shouldBlockControlCommand`-, Pairing-, Aktivierungsskip-, Routenblock- und
   Senderblock-Leitern über mindestens drei Plugins hinweg löscht.

3. Routenbeschreibungs-Builder, erwartetes Plugin-Delta: -200 bis -350.
   Wiederholten Aufbau von Routenziel- und Routensenderbeschreibungen in
   Core-Helfer verschieben. Erste Ziele: Google Chat, IRC, Microsoft Teams,
   Nextcloud Talk, Mattermost, Slack, Zalo, Zalo Personal.

4. Geteilter Turn-Aufbau, erwartetes Plugin-Delta: -250 bis -450.
   Gemeinsame Routen-/Session-/Envelope-/Dispatch-Sequenzierung für einfache
   Inbound-Plugins verwenden. Erste Ziele: QA Channel, IRC, Nextcloud Talk, Zalo,
   Zalo Personal.

5. Core neu packen, erwartetes Core-Delta: -300 bis -700.
   Nachdem Plugins Runtime-Projektionen direkt konsumieren, Einmal-Module löschen,
   winzige Dateien zurück in `runtime.ts` oder fokussierte Geschwisterdateien
   mergen und SDK-Kompatibilitätsdateien getrennt von gebündelten Hot Paths halten.

6. Testbereinigung, erwartetes Test-Delta: -300 bis -600.
   Tests löschen, die nur entfernte Wrapper-Formen prüfen. Verhaltenstests für
   Command-Ablehnung, Gruppen-Fallback, Origin-Subject-Abgleich,
   Aktivierungsskip, Zugriffsgruppen, Pairing und Redaction behalten.

Erwartete Mindestform für die Landung nach diesen Wellen:

```text
plugin production     <= -1,500
core production       about +1,800 to +2,200 before final repack
tests                 <= +500
total                 <= +2,000
```

## Nicht Verschieben

Verschieben Sie keine Plattform-Konfigurationsstandardwerte, Setup-UX, doctor/fix-Texte, API-Lookups,
Slack-Prüfungen auf owner-presence, Matrix-Alias-/Verifizierungshandling, Telegram-
Callback-Parsing, Befehlssyntax-Parsing, native Befehlsregistrierung, Reaktions-
Payload-Parsing, Kopplungsantworten, Befehlsantworten, Acks, Typing, Medien, Verlauf
oder Logs.

## Verifizierung

Gezielter lokaler Durchlauf:

```sh
pnpm lint:extensions:no-deprecated-channel-access
pnpm test src/channels/message-access/message-access.test.ts src/plugin-sdk/channel-ingress-runtime.test.ts src/plugin-sdk/access-groups.test.ts
pnpm test extensions/<changed-plugin>/src/...
pnpm plugin-sdk:api:check
pnpm config:docs:check
pnpm check:docs
git diff --check
```

Verwenden Sie Testbox für breite changed gates/full-suite-Nachweise, sobald der LOC-Trend
innerhalb des Budgets liegt.

Jedes Arbeitspaket erfasst:

- LOC vor/nachher nach Kategorie
- gelöschte Plugin-Wrapper
- neue Core-Hilfs-LOC, falls vorhanden
- ausgeführte gezielte Tests
- verbleibende Hotspot-Liste

## Exit-Kriterien

- gebündelte Produktionsimporte verwenden keine veralteten channel-access- oder command-auth-Fassaden
- Kompatibilitätscode ist auf SDK-/Core-Schnittstellen isoliert
- gebündelte Plugins nutzen ingress projections oder generische Ergebnisse direkt
- Plugin-Produktions-LOC sind netto mindestens 1.500 negativ gegenüber `origin/main`
- Core-Produktions-LOC sind <= +1.500, oder jeder Überschuss wird ausgeglichen, während die Gesamtsumme
  <= +2.000 bleibt
- repräsentative Tests decken Redaction, Route, Befehl/Ereignis, Aktivierung,
  access-group und channelspezifisches Fallback-Verhalten ab
